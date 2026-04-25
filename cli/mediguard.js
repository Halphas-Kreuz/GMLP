#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { loadConfig, saveConfig, defaultConfigPath } = require('./lib/config');
const { prompt, promptSecret, promptConfirm } = require('./lib/wizard');
const { runEval } = require('./lib/eval');

function printHelp() {
  console.log(`
mediguard - Medical LLM compliance evaluator

Usage:
  mediguard setup
  mediguard eval --module <1|2|3|4> [--limit N] [--out DIR]

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

  const cfg = { candidate, judge, outputs, version: 1 };

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
  const moduleNum = Number(args.module);
  if (![1, 2, 3, 4].includes(moduleNum)) {
    throw new Error('Missing or invalid --module (must be 1, 2, 3, or 4).');
  }

  const limit = args.limit != null ? Number(args.limit) : undefined;
  const outDir = args.out != null ? String(args.out) : undefined;

  await runEval({ moduleNum, limit, outDir });
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

