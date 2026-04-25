'use strict';

const readline = require('readline');

function rlOnce() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
}

function questionLine(q) {
  const rl = rlOnce();
  return new Promise((resolve) => rl.question(q, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

async function prompt(label, defaultValue) {
  const suffix = defaultValue != null && defaultValue !== '' ? ` [${defaultValue}]` : '';
  const ans = (await questionLine(`${label}${suffix}: `)).trim();
  return ans === '' ? defaultValue : ans;
}

// Minimal secret prompt: we cannot reliably disable echo in all terminals without extra deps.
// Keep it explicit in UX so users can paste and press enter.
async function promptSecret(label) {
  return prompt(label, '');
}

async function promptConfirm(label, defaultYes = true) {
  const def = defaultYes ? 'Y/n' : 'y/N';
  const ans = (await questionLine(`${label} (${def}): `)).trim().toLowerCase();
  if (ans === '') return defaultYes;
  if (ans === 'y' || ans === 'yes') return true;
  if (ans === 'n' || ans === 'no') return false;
  return defaultYes;
}

module.exports = {
  prompt,
  promptSecret,
  promptConfirm,
};

