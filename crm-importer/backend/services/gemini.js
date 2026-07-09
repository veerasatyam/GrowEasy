const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment. AI extraction will use local heuristics.");
}

/**
 * Retries a promise-returning function up to maxRetries times with exponential backoff.
 */
async function retryWithBackoff(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    console.warn(`⚠️ Gemini API call failed. Retrying in ${delay}ms... (${retries} attempts left). Error: ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

/**
 * Fallback semantic extraction engine using rule-based synonym matches
 * to guarantee offline capability (portability/evaluation protection).
 */
function extractLeadsHeuristically(headers, rows) {
  console.log("ℹ️ Running local heuristic fallback mapping...");
  const leads = [];
  
  const synonyms = {
    name: ["name", "client", "customer", "lead", "person", "full name", "contact", "first name"],
    email: ["email", "e-mail", "mail", "address", "email address", "customer email"],
    mobile_without_country_code: ["phone", "mobile", "tel", "cell", "contact number", "telephone", "phone number", "ph", "mob"],
    company: ["company", "organization", "firm", "business", "employer", "corporate", "org"],
    city: ["city", "town", "locality", "city name"],
    state: ["state", "province", "prov", "region", "territory"],
    country: ["country", "nation", "country name", "cntry"],
    lead_owner: ["owner", "lead owner", "sales rep", "assigned", "rep", "agent"],
    crm_status: ["status", "lead status", "crm status", "state", "priority"],
    crm_note: ["notes", "note", "remarks", "comment", "crm note", "description"],
    data_source: ["source", "lead source", "campaign", "medium", "channel", "origin", "referrer"],
    possession_time: ["possession", "possession time", "time", "possession date"],
    created_at: ["created_at", "created date", "date created", "lead date", "time", "timestamp", "date"]
  };

  // Build key mapping
  const mappings = {};
  for (const [field, synonymList] of Object.entries(synonyms)) {
    let bestHeader = null;
    let bestScore = 0;

    for (const h of headers) {
      const cleaned = h.toLowerCase().replace(/[\s_-]+/g, ' ').replace(/[^\w\s]/g, '').trim();
      
      if (cleaned === field.toLowerCase()) {
        bestHeader = h;
        break;
      }
      
      for (const syn of synonymList) {
        if (cleaned === syn) {
          bestHeader = h;
          bestScore = 1.0;
          break;
        } else if (cleaned.includes(syn) || syn.includes(cleaned)) {
          const score = syn === cleaned ? 0.9 : 0.6;
          if (score > bestScore) {
            bestScore = score;
            bestHeader = h;
          }
        }
      }
      if (bestHeader && bestScore === 1.0) break;
    }
    mappings[field] = bestHeader;
  }

  // Iterate over row objects
  for (const row of rows) {
    const lead = {
      created_at: "",
      name: "",
      email: "",
      country_code: "",
      mobile_without_country_code: "",
      company: "",
      city: "",
      state: "",
      country: "",
      lead_owner: "",
      crm_status: "",
      crm_note: "",
      data_source: "",
      possession_time: "",
      description: ""
    };

    // Extract mapped keys
    for (const [field, header] of Object.entries(mappings)) {
      if (header && row[header] !== undefined && row[header] !== null) {
        lead[field] = String(row[header]).trim();
      }
    }

    // Special combine logic for separate name columns
    if (mappings.name && mappings.name.toLowerCase().includes("first name")) {
      const lastNameHeader = headers.find(h => h.toLowerCase().includes("last name"));
      if (lastNameHeader && row[lastNameHeader]) {
        lead.name = `${lead.name} ${row[lastNameHeader]}`.trim();
      }
    }

    // Split country code from phone value if possible
    let rawPhone = lead.mobile_without_country_code || "";
    if (rawPhone) {
      rawPhone = rawPhone.trim();
      if (rawPhone.startsWith('+')) {
        const match = rawPhone.match(/^(\+\d{1,4})(.*)$/);
        if (match) {
          lead.country_code = match[1];
          lead.mobile_without_country_code = match[2].replace(/[^\d]/g, '');
        }
      } else if (rawPhone.startsWith('91') && rawPhone.length > 10) {
        lead.country_code = "+91";
        lead.mobile_without_country_code = rawPhone.substring(2).replace(/[^\d]/g, '');
      } else {
        lead.mobile_without_country_code = rawPhone.replace(/[^\d]/g, '');
      }
    }

    // Map status into standard enum
    const statusVal = String(lead.crm_status || "").toUpperCase();
    if (statusVal.includes("QUALIFIED") || statusVal.includes("FOLLOW") || statusVal.includes("GOOD")) {
      lead.crm_status = "GOOD_LEAD_FOLLOW_UP";
    } else if (statusVal.includes("NEW") || statusVal.includes("NOT") || statusVal.includes("DIAL") || statusVal.includes("PROGRESS")) {
      lead.crm_status = "DID_NOT_CONNECT";
    } else if (statusVal.includes("BAD") || statusVal.includes("UNQUALIFIED") || statusVal.includes("NOT INTERESTED")) {
      lead.crm_status = "BAD_LEAD";
    } else if (statusVal.includes("CONVERTED") || statusVal.includes("SALE") || statusVal.includes("DONE") || statusVal.includes("CLOSE")) {
      lead.crm_status = "SALE_DONE";
    } else {
      lead.crm_status = "GOOD_LEAD_FOLLOW_UP";
    }

    // Map data source into standard enum
    const sourceVal = String(lead.data_source || "").toLowerCase();
    if (sourceVal.includes("demand")) {
      lead.data_source = "leads_on_demand";
    } else if (sourceVal.includes("meridian") || sourceVal.includes("tower")) {
      lead.data_source = "meridian_tower";
    } else if (sourceVal.includes("eden") || sourceVal.includes("park")) {
      lead.data_source = "eden_park";
    } else if (sourceVal.includes("varah") || sourceVal.includes("swamy")) {
      lead.data_source = "varah_swamy";
    } else if (sourceVal.includes("sarjapur") || sourceVal.includes("plots")) {
      lead.data_source = "sarjapur_plots";
    } else {
      const noteVal = String(lead.crm_note || "").toLowerCase();
      if (noteVal.includes("leads_on_demand")) lead.data_source = "leads_on_demand";
      else if (noteVal.includes("meridian")) lead.data_source = "meridian_tower";
      else if (noteVal.includes("eden")) lead.data_source = "eden_park";
      else if (noteVal.includes("varah")) lead.data_source = "varah_swamy";
      else if (noteVal.includes("sarjapur")) lead.data_source = "sarjapur_plots";
      else lead.data_source = "";
    }

    // Keep crm_note clean
    if (row.Notes || row.notes || row.Notes) {
      lead.crm_note = String(row.Notes || row.notes || "").trim();
    }

    leads.push(lead);
  }

  return leads;
}

/**
 * Sends a batch of raw CSV rows to Google Gemini for semantic mapping and field extraction.
 * Falls back to local heuristics if API keys are exhausted or rate limited.
 * 
 * @param {Array<string>} headers - Original CSV column headers
 * @param {Array<Array<any>>} rows - Array of CSV row value arrays
 * @returns {Promise<Array<Object>>} Extracted CRM Lead objects
 */
async function extractLeadsBatch(headers, rows) {
  if (!genAI) {
    console.warn("⚠️ Gemini AI not initialized. Using local heuristics.");
    return extractLeadsHeuristically(headers, rows);
  }

  const prompt = `You are an expert CRM data extraction assistant.
Your task is to map arbitrary CSV column headers and row values into a standardized CRM Lead format.

### Target CRM Fields to Extract:
1. created_at: Lead creation date (must be formatted as a valid ISO-8601 string or "YYYY-MM-DD HH:MM:SS" that JS \`new Date()\` can parse, e.g. "2026-05-13 14:20:48").
2. name: Full name. If there are separate first name and last name columns, merge them (e.g. "John" and "Doe" -> "John Doe").
3. email: Primary email.
4. country_code: Country phone prefix, e.g., "+91", "+1".
5. mobile_without_country_code: Mobile number without country prefix or formatting (just digits, e.g., "9876543210").
6. company: Company or employer name.
7. city: City.
8. state: State or province.
9. country: Country.
10. lead_owner: Email of the assigned lead owner.
11. crm_status: Status of the lead. MUST be strictly one of these values (case-sensitive):
    - GOOD_LEAD_FOLLOW_UP
    - DID_NOT_CONNECT
    - BAD_LEAD
    - SALE_DONE
    If not specified or unclear, classify default to GOOD_LEAD_FOLLOW_UP.
12. crm_note: Remarks, follow-up details, additional comments, EXTRA email addresses, EXTRA phone numbers, or any other valuable info that doesn't fit another field.
13. data_source: Channel the lead came from. MUST be strictly one of these values (case-sensitive):
    - leads_on_demand
    - meridian_tower
    - eden_park
    - varah_swamy
    - sarjapur_plots
    If none match confidently, leave it empty/blank.
14. possession_time: Property possession time details if mentioned.
15. description: Additional description or text.

### Parsing Rules:
1. Multiple Emails/Phones: If a row has multiple emails, set primary 'email' to the first one, and append any remaining emails to 'crm_note'. If multiple phone numbers exist, put the first in 'mobile_without_country_code' and any others in 'crm_note'.
2. Country Code Extraction: If phone numbers in the CSV rows contain country codes (like "+919876..." or "+1 (555)..."), separate the country code (e.g. "+91") into 'country_code' and the rest of the digits into 'mobile_without_country_code'.
3. Skipping Invalid Records: If a row contains NEITHER a valid email NOR a mobile number, omit it from the output array.
4. Output Format: Return a JSON object with a single key "leads", containing an array of lead objects conforming to the schema above. Do not output markdown, code blocks, or explanations. Just return the raw JSON object.

### CSV Layout:
Headers: ${JSON.stringify(headers)}

### Batch Rows to Process:
${JSON.stringify(rows, null, 2)}
`;

  try {
    const apiCall = async () => {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ]
      });
      
      const response = await result.response;
      return response.text();
    };

    const responseText = await retryWithBackoff(apiCall);
    const parsed = JSON.parse(responseText);
    
    if (parsed && Array.isArray(parsed.leads)) {
      return parsed.leads;
    } else {
      console.warn("⚠️ Gemini response did not contain 'leads' array:", responseText);
      return extractLeadsHeuristically(headers, rows);
    }
  } catch (error) {
    console.error("⚠️ Gemini batch processing failed. Falling back to heuristic mapping. Error:", error.message);
    return extractLeadsHeuristically(headers, rows);
  }
}

module.exports = {
  extractLeadsBatch
};
