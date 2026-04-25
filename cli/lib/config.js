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

function loadConfig() {
  const p = defaultConfigPath();
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  const p = defaultConfigPath();
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}

module.exports = {
  repoRoot,
  defaultConfigPath,
  loadConfig,
  saveConfig,
};

