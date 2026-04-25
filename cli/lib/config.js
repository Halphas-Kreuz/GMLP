'use strict';

const fs = require('fs');
const path = require('path');

function repoRoot() {
  // cli/lib -> cli -> repo root
  return path.resolve(__dirname, '..', '..');
}

function defaultConfigPath() {
  return path.join(repoRoot(), '.mediguard', 'config.json');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function isValidEnvVarName(s) {
  return typeof s === 'string' && /^[A-Z_][A-Z0-9_]*$/.test(s);
}

function sanitizeConfig(cfg) {
  const out = cfg && typeof cfg === 'object' ? JSON.parse(JSON.stringify(cfg)) : {};
  let changed = false;

  out.candidate = out.candidate && typeof out.candidate === 'object' ? out.candidate : {};
  out.judge = out.judge && typeof out.judge === 'object' ? out.judge : {};

  // These fields must never contain secrets; they must be env var *names*.
  const defaults = {
    candidateApiKeyEnv: 'CANDIDATE_API_KEY',
    judgeApiKeyEnv: 'JUDGE_API_KEY',
    judgeApiKeyFallbackEnv: 'DEEPSEEK_API_KEY',
  };

  if (!isValidEnvVarName(out.candidate.apiKeyEnv)) {
    out.candidate.apiKeyEnv = defaults.candidateApiKeyEnv;
    changed = true;
  }
  if (!isValidEnvVarName(out.judge.apiKeyEnv)) {
    out.judge.apiKeyEnv = defaults.judgeApiKeyEnv;
    changed = true;
  }
  if (out.judge.apiKeyFallbackEnv != null && out.judge.apiKeyFallbackEnv !== '' && !isValidEnvVarName(out.judge.apiKeyFallbackEnv)) {
    out.judge.apiKeyFallbackEnv = defaults.judgeApiKeyFallbackEnv;
    changed = true;
  }

  return { cfg: out, changed };
}

function loadConfig() {
  const p = defaultConfigPath();
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    const { cfg, changed } = sanitizeConfig(parsed);
    // If we detect invalid env var names, rewrite immediately to scrub accidental secrets.
    if (changed) {
      ensureDir(path.dirname(p));
      fs.writeFileSync(p, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
    }
    return cfg;
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  const p = defaultConfigPath();
  ensureDir(path.dirname(p));
  const { cfg: sanitized } = sanitizeConfig(cfg);
  fs.writeFileSync(p, JSON.stringify(sanitized, null, 2) + '\n', 'utf8');
}

module.exports = {
  repoRoot,
  defaultConfigPath,
  loadConfig,
  saveConfig,
};
