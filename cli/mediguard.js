#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { loadConfig, saveConfig, defaultConfigPath } = require('./lib/config');
const { prompt, promptSecret, promptConfirm } = require('./lib/wizard');
const { loadDotenvFile } = require('./lib/dotenv');
const { runEval } = require('./lib/eval');

// Load local secrets/config from repo root when running via Node CLI.
// This removes the need to "source .env" in the shell.
const repoRoot = path.resolve(__dirname, '..');
loadDotenvFile(path.join(repoRoot, '.env'));
loadDotenvFile(path.join(repoRoot, '.mediguard', 'keys.env'));

function printHelp() {
  console.log(`
mediguard - Medical LLM compliance evaluator

Usage:
  mediguard setup
  mediguard eval --module <1|2|3|4> [--limit N] [--out DIR]
  mediguard eval --modules 1,2,3,4 [--limit N] [--out DIR]
  mediguard eval --all [--limit N] [--out DIR]

Notes:
  - This CLI automatically loads /Users/oblivion/Desktop/GMLP/.env and /Users/oblivion/Desktop/GMLP/.mediguard/keys.env if present.

Environment variable overrides:
  Candidate:
    CANDIDATE_API_KEY
    CANDIDATE_BASE_URL
    CANDIDATE_CHAT_PATH
    CANDIDATE_MODEL

  Judge (OpenAI-compatible):
    JUDGE_API_KEY (or DEEPSEEK_API_KEY fallback)
    JUDGE_BASE_URL
    JUDGE_CHAT_PATH
    JUDGE_MODEL
`.trim());
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val == null || val.startsWith('--')) args[key] = true;
      else {
        args[key] = val;
        i++;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function cmdSetup() {
  console.log('MediGuard setup wizard (OpenAI-compatible endpoints).');
  console.log(`Config file: ${defaultConfigPath()}`);
  console.log('');

  const existing = loadConfig();

  const candidate = { ...(existing.candidate || {}) };
  candidate.baseUrl = await prompt('Candidate base URL', candidate.baseUrl || 'https://api.openai.com');
  candidate.chatPath = await prompt('Candidate chat completions path', candidate.chatPath || '/v1/chat/completions');
  candidate.model = await prompt('Candidate model', candidate.model || 'gpt-4.1-mini');
  candidate.apiKeyEnv = await prompt('Env var name for candidate API key', candidate.apiKeyEnv || 'CANDIDATE_API_KEY');

  console.log('');

  const judge = { ...(existing.judge || {}) };
  judge.baseUrl = await prompt('Judge base URL', judge.baseUrl || 'https://api.deepseek.com');
  judge.chatPath = await prompt('Judge chat completions path', judge.chatPath || '/v1/chat/completions');
  judge.model = await prompt('Judge model', judge.model || 'deepseek-reasoner');
  judge.apiKeyEnv = await prompt('Env var name for judge API key', judge.apiKeyEnv || 'JUDGE_API_KEY');
  judge.apiKeyFallbackEnv = await prompt('Fallback env var name (optional)', judge.apiKeyFallbackEnv || 'DEEPSEEK_API_KEY');

  console.log('');

  const outputs = { ...(existing.outputs || {}) };
  outputs.dir = await prompt('Reports output directory', outputs.dir || 'reports');

  console.log('');
  const wantKeys = await promptConfirm('Save API keys locally (gitignored) via wizard?', true);
  let keysFile = null;
  if (wantKeys) {
    const choice = await prompt('Where to save keys (.env or .mediguard/keys.env)', existing.keysFile || '.env');
    keysFile = choice === '.mediguard/keys.env' ? '.mediguard/keys.env' : '.env';

    const candidateKey = await promptSecret(`Paste candidate API key (env ${candidate.apiKeyEnv})`);
    const judgeKey = await promptSecret(`Paste judge API key (env ${judge.apiKeyEnv})`);

    const absKeysPath = path.join(repoRoot, keysFile);
    const absDir = path.dirname(absKeysPath);
    fs.mkdirSync(absDir, { recursive: true });

    // Merge: keep existing lines when possible, update or append our keys.
    let existingLines = [];
    try {
      existingLines = fs.readFileSync(absKeysPath, 'utf8').split(/\r?\n/);
    } catch {
      existingLines = ['# MediGuard local secrets (gitignored)', ''];
    }

    const setLine = (key, val) => {
      if (!val) return;
      const idx = existingLines.findIndex((l) => l.startsWith(`${key}=`));
      const line = `${key}=${val}`;
      if (idx >= 0) existingLines[idx] = line;
      else existingLines.push(line);
    };

    setLine(candidate.apiKeyEnv, candidateKey);
    setLine(judge.apiKeyEnv, judgeKey);

    fs.writeFileSync(absKeysPath, existingLines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n') + '\n', 'utf8');
    console.log(`Saved keys to ${absKeysPath}`);
  }

  const cfg = { candidate, judge, outputs, version: 1 };
  if (keysFile) cfg.keysFile = keysFile;

  console.log('');
  if (await promptConfirm('Write config now?', true)) {
    saveConfig(cfg);
    console.log(`Wrote ${defaultConfigPath()}`);
  } else {
    console.log('Skipped writing config.');
  }

  console.log('');
  console.log('Next: export your API keys and run: mediguard eval --module 3');
}

async function cmdEval(args) {
  const limit = args.limit != null ? Number(args.limit) : undefined;
  const outDir = args.out != null ? String(args.out) : undefined;

  let modules = null;
  if (args.all === true) {
    modules = [1, 2, 3, 4];
  } else if (args.modules != null) {
    modules = String(args.modules)
      .split(',')
      .map((s) => Number(String(s).trim()))
      .filter((n) => Number.isFinite(n));
  } else {
    const moduleNum = Number(args.module);
    modules = [moduleNum];
  }

  const invalid = modules.filter((m) => ![1, 2, 3, 4].includes(m));
  if (invalid.length > 0) {
    throw new Error(`Invalid module(s): ${invalid.join(', ')}. Use 1,2,3,4.`);
  }

  for (const moduleNum of modules) {
    await runEval({ moduleNum, limit, outDir });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  if (args.help || args._.length === 0) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const sub = args._[0];
  if (sub === 'setup') return cmdSetup();
  if (sub === 'eval') return cmdEval(args);

  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error(`ERROR: ${err && err.message ? err.message : String(err)}`);
  process.exit(1);
});
