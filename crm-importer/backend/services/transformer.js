/**
 * Sanitizes and validates a list of leads extracted by the AI.
 * Enforces the CRM field enum lists, multiple emails/phones splits,
 * newline escaping, and skipping constraints.
 * 
 * @param {Array<Object>} leads - Leads returned by the AI provider
 * @returns {Object} { imported: Array, skipped: Array }
 */
function sanitizeAndValidateLeads(leads) {
  const ALLOWED_STATUSES = [
    'GOOD_LEAD_FOLLOW_UP',
    'DID_NOT_CONNECT',
    'BAD_LEAD',
    'SALE_DONE'
  ];

  const ALLOWED_SOURCES = [
    'leads_on_demand',
    'meridian_tower',
    'eden_park',
    'varah_swamy',
    'sarjapur_plots'
  ];

  const imported = [];
  const skipped = [];

  // Helper to escape newlines for CSV single-row compatibility
  const escapeNewlines = (str) => {
    if (!str) return "";
    return String(str).replace(/\r?\n/g, '\\n');
  };

  for (const lead of leads) {
    // 1. Split multiple emails if merged by comma or semicolon
    let rawEmail = lead.email ? String(lead.email).trim() : "";
    let primaryEmail = "";
    let extraEmails = [];
    
    if (rawEmail) {
      const emailParts = rawEmail.split(/[\s,;]+/).filter(Boolean);
      if (emailParts.length > 0) {
        primaryEmail = emailParts[0];
        extraEmails = emailParts.slice(1);
      }
    }

    // 2. Split multiple phone numbers if merged by slash, comma, or semicolon
    let rawMobile = lead.mobile_without_country_code ? String(lead.mobile_without_country_code).trim() : "";
    let primaryMobile = "";
    let extraPhones = [];
    
    if (rawMobile) {
      // Split strictly by explicit separators (comma, semicolon, slash) to avoid breaking spaces inside a single formatted number
      const phoneParts = rawMobile.split(/[,;\/]+/).map(p => p.trim()).filter(Boolean);
      if (phoneParts.length > 1) {
        primaryMobile = phoneParts[0].replace(/[^\d]/g, '');
        extraPhones = phoneParts.slice(1).map(p => p.replace(/[^\d]/g, '')).filter(Boolean);
      } else {
        primaryMobile = rawMobile.replace(/[^\d]/g, '');
      }
    }

    // 3. Skip check: must contain email OR mobile number
    if (!primaryEmail && !primaryMobile) {
      skipped.push({
        name: lead.name ? escapeNewlines(lead.name) : "Unknown Lead",
        reason: "Contains neither email nor mobile number",
        details: lead
      });
      continue;
    }

    // 4. Validate created_at date format
    let createdAt = lead.created_at ? String(lead.created_at).trim() : "";
    let parsedDate = new Date(createdAt);
    if (!createdAt || isNaN(parsedDate.getTime())) {
      const d = new Date();
      createdAt = d.toISOString().replace('T', ' ').substring(0, 19);
    } else {
      createdAt = parsedDate.toISOString().replace('T', ' ').substring(0, 19);
    }

    // 5. Validate crm_status enum
    let status = lead.crm_status ? String(lead.crm_status).trim().toUpperCase() : 'GOOD_LEAD_FOLLOW_UP';
    status = status.replace(/[\s-]/g, '_');
    if (!ALLOWED_STATUSES.includes(status)) {
      status = 'GOOD_LEAD_FOLLOW_UP'; // Fallback
    }

    // 6. Validate data_source enum
    let source = lead.data_source ? String(lead.data_source).trim().toLowerCase() : "";
    source = source.replace(/[\s-]/g, '_');
    if (!ALLOWED_SOURCES.includes(source)) {
      source = ""; // Leave blank if not confidently matching
    }

    // 7. Consolidate secondary emails and phone numbers into crm_note
    let crmNote = lead.crm_note ? String(lead.crm_note).trim() : "";
    if (extraEmails.length > 0) {
      const emailNote = `[Extra Emails: ${extraEmails.join(', ')}]`;
      crmNote = crmNote ? `${crmNote} | ${emailNote}` : emailNote;
    }
    if (extraPhones.length > 0) {
      const phoneNote = `[Extra Phone Numbers: ${extraPhones.join(', ')}]`;
      crmNote = crmNote ? `${crmNote} | ${phoneNote}` : phoneNote;
    }

    // 8. Build final standardized lead object with single-row CSV compatibility
    const standardizedLead = {
      created_at: createdAt,
      name: lead.name ? escapeNewlines(lead.name) : "Unknown Lead",
      email: primaryEmail.toLowerCase(),
      country_code: lead.country_code ? escapeNewlines(lead.country_code) : "",
      mobile_without_country_code: primaryMobile,
      company: lead.company ? escapeNewlines(lead.company) : "",
      city: lead.city ? escapeNewlines(lead.city) : "",
      state: lead.state ? escapeNewlines(lead.state) : "",
      country: lead.country ? escapeNewlines(lead.country) : "",
      lead_owner: lead.lead_owner ? escapeNewlines(lead.lead_owner).toLowerCase() : "",
      crm_status: status,
      crm_note: escapeNewlines(crmNote),
      data_source: source,
      possession_time: lead.possession_time ? escapeNewlines(lead.possession_time) : "",
      description: lead.description ? escapeNewlines(lead.description) : ""
    };

    imported.push(standardizedLead);
  }

  return {
    imported,
    skipped,
    totalImported: imported.length,
    totalSkipped: skipped.length
  };
}

module.exports = {
  sanitizeAndValidateLeads
};
