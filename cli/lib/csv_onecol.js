'use strict';

const fs = require('fs');

// This project currently uses a single-column CSV with header "patient_query".
// We implement a small, predictable parser that handles:
// - quoted values (")
// - escaped quotes ("")
// - optional CRLF
function parseOneColumnCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = lines[0].trim();
  if (!/^patient_query\b/i.test(header)) {
    throw new Error(`Unexpected CSV header in ${filePath}: ${header}`);
  }
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    let s = lines[i].trim();
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.slice(1, -1).replace(/""/g, '"');
    }
    out.push(s);
  }
  return out;
}

module.exports = { parseOneColumnCsv };

