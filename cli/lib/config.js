'use strict';

const fs = require('fs');
const path = require('path');

function packageRoot() {
  // cli/lib -> cli -> package root (repo root when running from source)
  return path.resolve(__dirname, '..', '..');
}

function workdirRoot() {
  // Where the user runs the CLI from. For npx/global installs, this is their project folder.
  return process.cwd();
}

function workdirConfigPath() {
  return path.join(workdirRoot(), '.gmlp-auditor', 'config.json');
}

function packageConfigPath() {
  return path.join(packageRoot(), '.gmlp-auditor', 'config.json');
}

function defaultConfigPath() {
  // Prefer writing config in the user's current directory.
  return workdirConfigPath();
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
  // Backward compatibility: old config dir name.
  const legacyWorkdir = path.join(workdirRoot(), '.mediguard', 'config.json');
  const legacyPackage = path.join(packageRoot(), '.mediguard', 'config.json');
  const candidates = [workdirConfigPath(), legacyWorkdir, packageConfigPath(), legacyPackage];
  for (const p of candidates) {
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
      // continue
    }
  }
  return {};
}

function saveConfig(cfg) {
  const p = workdirConfigPath();
  ensureDir(path.dirname(p));
  const { cfg: sanitized } = sanitizeConfig(cfg);
  fs.writeFileSync(p, JSON.stringify(sanitized, null, 2) + '\n', 'utf8');
}

module.exports = {
  packageRoot,
  workdirRoot,
  defaultConfigPath,
  loadConfig,
  saveConfig,
};
