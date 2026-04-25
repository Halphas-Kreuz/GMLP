'use strict';

const fs = require('fs');

function parseDotenv(content) {
  const out = {};
  const lines = String(content).split(/\r?\n/);
  for (const line of lines) {
    const s = line.trim();
    if (s === '' || s.startsWith('#')) continue;
    const eq = s.indexOf('=');
    if (eq <= 0) continue;
    const key = s.slice(0, eq).trim();
    let val = s.slice(eq + 1).trim();
    // Strip optional wrapping quotes (basic).
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadDotenvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const vars = parseDotenv(content);
    for (const [k, v] of Object.entries(vars)) {
      if (process.env[k] == null) process.env[k] = v;
    }
    return { loaded: true, count: Object.keys(vars).length };
  } catch {
    return { loaded: false, count: 0 };
  }
}

module.exports = { loadDotenvFile, parseDotenv };

