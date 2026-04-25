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

// Masked secret prompt (does not store secrets on disk; only returns the value to caller).
// Implementation based on readline output suppression; works in most terminals.
async function promptSecret(label) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.stdoutMuted = false;
  rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted) {
      // Render minimal feedback without leaking the secret.
      if (stringToWrite.trim() !== '') rl.output.write('*');
      return;
    }
    rl.output.write(stringToWrite);
  };

  // Print the prompt normally, then mute output so only masked input is shown.
  rl.output.write(`${label}: `);
  rl.stdoutMuted = true;

  return await new Promise((resolve) => {
    rl.question('', (ans) => {
      rl.close();
      process.stdout.write('\n');
      resolve(String(ans || '').trim());
    });
  });
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
