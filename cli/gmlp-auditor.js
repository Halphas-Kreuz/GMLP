#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { loadConfig, saveConfig, defaultConfigPath } = require('./lib/config');
const { prompt, promptSecret, promptConfirm } = require('./lib/wizard');
const { runEval } = require('./lib/eval');

const repoRoot = path.resolve(__dirname, '..');

function isValidEnvVarName(s) {
  return typeof s === 'string' && /^[A-Z_][A-Z0-9_]*$/.test(s);
}

async function promptEnvVarName(label, defaultValue) {
  while (true) {
    const v = await prompt(label, defaultValue);
    if (isValidEnvVarName(v)) return v;
    console.log('Invalid env var name. Use only A-Z, 0-9, and underscore; must start with A-Z or underscore.');
  }
}

function tryParseChatUrl(chatUrl) {
  try {
    const u = new URL(String(chatUrl));
    const baseUrl = `${u.protocol}//${u.host}`;
    const chatPath = u.pathname || '/v1/chat/completions';
    return { baseUrl, chatPath };
  } catch {
    return null;
  }
}

function presetFor(name, kind) {
  const n = String(name || '').trim().toLowerCase();
  if (kind === 'candidate') {
    if (n === 'openai') return { baseUrl: 'https://api.openai.com', chatPath: '/v1/chat/completions', model: 'gpt-4.1-mini' };
    if (n === 'deepseek') return { baseUrl: 'https://api.deepseek.com', chatPath: '/v1/chat/completions', model: 'deepseek-chat' };
    if (n === 'custom') return {};
    return null;
  }
  if (kind === 'judge') {
    if (n === 'deepseek') return { baseUrl: 'https://api.deepseek.com', chatPath: '/v1/chat/completions', model: 'deepseek-reasoner' };
    if (n === 'openai') return { baseUrl: 'https://api.openai.com', chatPath: '/v1/chat/completions', model: 'gpt-4.1-mini' };
    if (n === 'custom') return {};
    return null;
  }
  return null;
}

function printHelp() {
  console.log(`
gmlp-auditor - Medical LLM compliance evaluator (GMLP-aligned)

Usage:
  gmlp-auditor setup
  gmlp-auditor smoke
  gmlp-auditor eval --module <1|2|3|4> [--limit N] [--out DIR]
  gmlp-auditor eval --modules 1,2,3,4 [--limit N] [--out DIR]
  gmlp-auditor eval --all [--limit N] [--out DIR]
  gmlp-auditor eval --all --limit 3 --wizard

Notes:
  - This CLI does NOT store API keys. Provide keys via environment variables or the interactive prompt.
  - If you only know a provider's full chat-completions URL, paste it into setup when asked. The wizard will derive base URL + path.
  - "smoke" runs an interactive flow: candidate config -> candidate key -> judge config -> judge key -> then asks before starting tests (no keys stored).

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

async function collectCandidate(existingCandidate) {
  const candidate = { ...(existingCandidate || {}) };

  console.log('Candidate settings');
  const candidatePreset = await prompt('Preset (openai/deepseek/custom)', candidate.preset || 'openai');
  const candidateFromPreset = presetFor(candidatePreset, 'candidate');
  if (candidateFromPreset) {
    candidate.preset = candidatePreset;
    candidate.baseUrl = candidate.baseUrl || candidateFromPreset.baseUrl;
    candidate.chatPath = candidate.chatPath || candidateFromPreset.chatPath;
    candidate.model = candidate.model || candidateFromPreset.model;
  }

  const candidateChatUrl = await prompt('Full chat completions URL (optional)', '');
  const parsedCandidate = candidateChatUrl ? tryParseChatUrl(candidateChatUrl) : null;
  if (parsedCandidate) {
    candidate.baseUrl = parsedCandidate.baseUrl;
    candidate.chatPath = parsedCandidate.chatPath;
  }

  candidate.baseUrl = await prompt('Base URL', candidate.baseUrl || 'https://api.openai.com');
  candidate.chatPath = await prompt('Chat completions path', candidate.chatPath || '/v1/chat/completions');
  candidate.model = await prompt('Model', candidate.model || 'gpt-4.1-mini');
  candidate.apiKeyEnv = await promptEnvVarName('Env var name for API key', candidate.apiKeyEnv || 'CANDIDATE_API_KEY');

  return candidate;
}

async function collectJudge(existingJudge) {
  const judge = { ...(existingJudge || {}) };

  console.log('Judge settings');
  const judgePreset = await prompt('Preset (deepseek/openai/custom)', judge.preset || 'deepseek');
  const judgeFromPreset = presetFor(judgePreset, 'judge');
  if (judgeFromPreset) {
    judge.preset = judgePreset;
    judge.baseUrl = judge.baseUrl || judgeFromPreset.baseUrl;
    judge.chatPath = judge.chatPath || judgeFromPreset.chatPath;
    judge.model = judge.model || judgeFromPreset.model;
  }

  const judgeChatUrl = await prompt('Full chat completions URL (optional)', '');
  const parsedJudge = judgeChatUrl ? tryParseChatUrl(judgeChatUrl) : null;
  if (parsedJudge) {
    judge.baseUrl = parsedJudge.baseUrl;
    judge.chatPath = parsedJudge.chatPath;
  }

  judge.baseUrl = await prompt('Base URL', judge.baseUrl || 'https://api.deepseek.com');
  judge.chatPath = await prompt('Chat completions path', judge.chatPath || '/v1/chat/completions');
  judge.model = await prompt('Model', judge.model || 'deepseek-reasoner');
  judge.apiKeyEnv = await promptEnvVarName('Env var name for API key', judge.apiKeyEnv || 'JUDGE_API_KEY');
  judge.apiKeyFallbackEnv = await promptEnvVarName('Fallback env var name (optional)', judge.apiKeyFallbackEnv || 'DEEPSEEK_API_KEY');

  return judge;
}

async function collectOutputs(existingOutputs) {
  const outputs = { ...(existingOutputs || {}) };
  console.log('Output settings');
  outputs.dir = await prompt('Reports output directory', outputs.dir || 'reports');
  return outputs;
}

async function cmdSetup({ showNextMessage } = {}) {
  console.log('GMLP-Auditor setup wizard (OpenAI-compatible endpoints).');
  console.log(`Config file: ${defaultConfigPath()}`);
  console.log('');

  const existing = loadConfig();
  const candidate = await collectCandidate(existing.candidate);
  console.log('');
  const judge = await collectJudge(existing.judge);
  console.log('');
  const outputs = await collectOutputs(existing.outputs);

  const cfg = { candidate, judge, outputs, version: 1 };

  console.log('');
  if (await promptConfirm('Write config now?', true)) {
    saveConfig(cfg);
    console.log(`Wrote ${defaultConfigPath()}`);
  } else {
    console.log('Skipped writing config.');
  }

  if (showNextMessage !== false) {
    console.log('');
    console.log('Next: run eval with --wizard to enter keys for this session only.');
    console.log('Example: gmlp-auditor eval --all --limit 3 --wizard');
  }
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
    await runEval({ moduleNum, limit, outDir, interactive: args.wizard === true });
  }
}

async function cmdSmoke() {
  console.log('GMLP-Auditor smoke test (no API keys stored).');
  console.log(`Config file: ${defaultConfigPath()}`);
  console.log('');

  const existing = loadConfig();

  const candidate = await collectCandidate(existing.candidate);
  console.log('');
  console.log('Next: paste the candidate API key (input hidden).');
  const candidateKey = await promptSecret(`Candidate API key (${candidate.apiKeyEnv})`);
  if (candidateKey) process.env[candidate.apiKeyEnv] = candidateKey;

  console.log('');

  const judge = await collectJudge(existing.judge);
  console.log('');
  console.log('Next: paste the judge API key (input hidden).');
  const judgeKey = await promptSecret(`Judge API key (${judge.apiKeyEnv})`);
  if (judgeKey) process.env[judge.apiKeyEnv] = judgeKey;

  console.log('');

  const outputs = await collectOutputs(existing.outputs);
  const cfg = { candidate, judge, outputs, version: 1 };

  console.log('');
  if (await promptConfirm('Write config now? (no keys)', true)) {
    saveConfig(cfg);
    console.log(`Wrote ${defaultConfigPath()}`);
  } else {
    console.log('Skipped writing config.');
  }

  console.log('');
  const runNow = await promptConfirm('Start the smoke test now?', false);
  if (runNow) {
    await cmdEval({ all: true, limit: '3', wizard: false });
  } else {
    // Best-effort: scrub keys from the current process environment.
    delete process.env[candidate.apiKeyEnv];
    delete process.env[judge.apiKeyEnv];
    console.log('Okay. Not running any tests yet.');
    console.log('When ready, run: gmlp-auditor eval --all --limit 3 --wizard');
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
  if (sub === 'setup') return cmdSetup({ showNextMessage: true });
  if (sub === 'smoke') return cmdSmoke();
  if (sub === 'eval') return cmdEval(args);

  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error(`ERROR: ${err && err.message ? err.message : String(err)}`);
  process.exit(1);
});
