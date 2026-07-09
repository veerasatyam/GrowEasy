const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { extractLeadsBatch } = require('../services/ai');
const { sanitizeAndValidateLeads } = require('../services/transformer');

const router = express.Router();

// Multer in-memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Parses a CSV buffer using the csv-parser stream.
 * Returns headers and row objects.
 */
function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    let headers = [];
    
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    
    stream
      .pipe(csv())
      .on('headers', (hdrList) => {
        headers = hdrList;
      })
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        resolve({ headers, rows: results });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * POST /api/import
 * Accept CSV upload, parse, batch process through OpenAI, validate, and return JSON.
 */
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded. Please upload a CSV file." });
  }

  try {
    const { headers, rows } = await parseCsvBuffer(req.file.buffer);
    
    if (rows.length === 0) {
      return res.status(400).json({ error: "The uploaded CSV file is empty." });
    }

    console.log(`Parsed CSV with ${headers.length} headers and ${rows.length} rows.`);

    // Batch settings (15 rows per batch)
    const BATCH_SIZE = 15;
    let allRawExtractedLeads = [];
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batchRows = rows.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`Processing batch ${batchNum} of ${totalBatches} (${batchRows.length} rows)...`);
      
      try {
        const batchLeads = await extractLeadsBatch(headers, batchRows);
        allRawExtractedLeads = allRawExtractedLeads.concat(batchLeads);
      } catch (batchError) {
        console.error(`❌ Error processing batch ${batchNum}:`, batchError.message);
        // Continue to next batch if one fails, to preserve rest of import (fault-tolerance)
      }
    }

    // Sanitize and validate all extracted leads
    const result = sanitizeAndValidateLeads(allRawExtractedLeads);
    
    return res.json(result);

  } catch (error) {
    console.error("❌ Import pipeline failed:", error);
    return res.status(500).json({ error: "Internal Server Error during CSV import: " + error.message });
  }
});

module.exports = router;
