'use strict';

const fs = require('fs');
const path = require('path');

const { packageRoot, workdirRoot, loadConfig } = require('./config');
const { parseOneColumnCsv } = require('./csv_onecol');
const { chatCompletions, envOr } = require('./openai_compat');
const { promptSecret } = require('./wizard');

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function modulePaths(moduleNum) {
  const root = packageRoot();
  return {
    csv: path.join(root, 'data', `questions_module${moduleNum}.csv`),
    candidatePrompt: path.join(root, 'prompts', 'candidate_common.txt'),
    judge: path.join(root, 'judges', `judge_module${moduleNum}.js`),
  };
}

function renderTemplate(s, vars) {
  return String(s).replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeReport(outDir, moduleNum, report) {
  ensureDir(outDir);
  const stamp = nowStamp();
  const base = path.join(outDir, `module${moduleNum}-${stamp}`);
  fs.writeFileSync(`${base}.json`, JSON.stringify(report, null, 2) + '\n', 'utf8');

  const lines = [];
  lines.push(`# GMLP-Auditor Report - Module ${moduleNum}`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Total cases: ${report.summary.total}`);
  lines.push(`Pass: ${report.summary.pass}`);
  lines.push(`Fail: ${report.summary.fail}`);
  lines.push('');
  lines.push('## Cases');
  lines.push('');
  for (const c of report.cases) {
    lines.push(`### ${c.id} - ${c.result.pass ? 'PASS' : 'FAIL'} (${c.result.score})`);
    lines.push('');
    lines.push('Patient query:');
    lines.push('');
    lines.push('```');
    lines.push(c.patient_query);
    lines.push('```');
    lines.push('');
    lines.push('Judge reason:');
    lines.push('');
    lines.push('```');
    lines.push(c.result.reason);
    lines.push('```');
    lines.push('');
  }
  fs.writeFileSync(`${base}.md`, lines.join('\n'), 'utf8');

  return { jsonPath: `${base}.json`, mdPath: `${base}.md` };
}

async function runEval({ moduleNum, limit, outDir, interactive }) {
  const cfg = loadConfig();
  const workspace = workdirRoot();
  const { csv, candidatePrompt, judge } = modulePaths(moduleNum);

  const candidateCfg = cfg.candidate || {};
  const judgeCfg = cfg.judge || {};
  const outputsCfg = cfg.outputs || {};

  let candidateKey = envOr(candidateCfg.apiKeyEnv, 'CANDIDATE_API_KEY');
  let judgeKey = envOr(judgeCfg.apiKeyEnv, judgeCfg.apiKeyFallbackEnv || 'DEEPSEEK_API_KEY');

  if (!candidateKey && interactive) {
    console.log('Candidate API key is required for this run (input hidden).');
    candidateKey = await promptSecret(`Enter candidate API key (${candidateCfg.apiKeyEnv || 'CANDIDATE_API_KEY'})`);
  }
  if (!judgeKey && interactive) {
    console.log('Judge API key is required for this run (input hidden).');
    judgeKey = await promptSecret(`Enter judge API key (${judgeCfg.apiKeyEnv || 'JUDGE_API_KEY'})`);
  }

  // Export judge settings for the existing judge scripts (keeps promptfoo compatibility too).
  if (judgeKey) process.env.JUDGE_API_KEY = judgeKey;
  if (judgeCfg.baseUrl) process.env.JUDGE_BASE_URL = judgeCfg.baseUrl;
  if (judgeCfg.chatPath) process.env.JUDGE_CHAT_PATH = judgeCfg.chatPath;
  if (judgeCfg.model) process.env.JUDGE_MODEL = judgeCfg.model;

  if (!candidateKey) {
    throw new Error(`Missing candidate API key. Set env ${candidateCfg.apiKeyEnv || 'CANDIDATE_API_KEY'}.`);
  }
  if (!judgeKey) {
    throw new Error(`Missing judge API key. Set env ${judgeCfg.apiKeyEnv || 'JUDGE_API_KEY'} (or ${judgeCfg.apiKeyFallbackEnv || 'DEEPSEEK_API_KEY'}).`);
  }

  const queries = parseOneColumnCsv(csv);
  const promptTemplate = fs.readFileSync(candidatePrompt, 'utf8');
  const judgeFn = require(judge);

  const maxN = limit != null && Number.isFinite(limit) ? Math.max(0, limit) : queries.length;
  const selected = queries.slice(0, maxN);

  console.log(`Running Module ${moduleNum}`);
  console.log(`Cases: ${selected.length}/${queries.length}`);
  console.log('');

  const cases = [];
  for (let i = 0; i < selected.length; i++) {
    const patient_query = selected[i];
    const id = `case_${String(i + 1).padStart(3, '0')}`;
    console.log(`[${id}] generating candidate output...`);

    const promptText = renderTemplate(promptTemplate, { patient_query });
    const { content: candidateOutput } = await chatCompletions({
      baseUrl: candidateCfg.baseUrl || process.env.CANDIDATE_BASE_URL,
      chatPath: candidateCfg.chatPath || process.env.CANDIDATE_CHAT_PATH || '/v1/chat/completions',
      apiKey: candidateKey,
      model: candidateCfg.model || process.env.CANDIDATE_MODEL,
      messages: [{ role: 'user', content: promptText }],
      temperature: 0.7,
    });

    console.log(`[${id}] judging...`);
    const result = await judgeFn(candidateOutput, { vars: { patient_query } });

    cases.push({
      id,
      patient_query,
      candidate_output: candidateOutput,
      result,
    });

    console.log(`[${id}] done: ${result.pass ? 'PASS' : 'FAIL'} score=${result.score}`);
    console.log('');
  }

  const summary = {
    total: cases.length,
    pass: cases.filter((c) => c.result && c.result.pass).length,
    fail: cases.filter((c) => !c.result || !c.result.pass).length,
  };

  const report = {
    module: moduleNum,
    generated_at: new Date().toISOString(),
    config_snapshot: {
      candidate: {
        baseUrl: candidateCfg.baseUrl || process.env.CANDIDATE_BASE_URL,
        chatPath: candidateCfg.chatPath || process.env.CANDIDATE_CHAT_PATH || '/v1/chat/completions',
        model: candidateCfg.model || process.env.CANDIDATE_MODEL,
        apiKeyEnv: candidateCfg.apiKeyEnv || 'CANDIDATE_API_KEY',
      },
      judge: {
        baseUrl: judgeCfg.baseUrl || process.env.JUDGE_BASE_URL,
        chatPath: judgeCfg.chatPath || process.env.JUDGE_CHAT_PATH || '/v1/chat/completions',
        model: judgeCfg.model || process.env.JUDGE_MODEL,
        apiKeyEnv: judgeCfg.apiKeyEnv || 'JUDGE_API_KEY',
        apiKeyFallbackEnv: judgeCfg.apiKeyFallbackEnv || 'DEEPSEEK_API_KEY',
      },
    },
    summary,
    cases,
  };

  const resolvedOutDir = outDir
    ? (path.isAbsolute(outDir) ? outDir : path.join(workspace, outDir))
    : path.join(workspace, outputsCfg.dir || 'reports');
  const finalOutDir = resolvedOutDir;
  const paths = writeReport(finalOutDir, moduleNum, report);
  console.log('Report written:');
  console.log(`  ${paths.jsonPath}`);
  console.log(`  ${paths.mdPath}`);
}

module.exports = { runEval };
