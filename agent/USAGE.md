# Using GMLP-Auditor As An Agent

This repo is designed so the **agent experience** is just a thin wrapper around a reliable local CLI.

## What The Agent Does

1. Collects (or confirms) candidate + judge endpoint settings (OpenAI-compatible).
2. Guides you to enter API keys only at runtime (no disk storage, no chat logs).
3. Runs `gmlp-auditor` evaluations.
4. Summarizes results and points you to the generated reports.

## Quickstart (Recommended)

1. Open this repo in your coding agent environment (Codex or Claude Code).
2. Ask the agent to run a smoke test:
   - “Run all modules with 3 cases each.”
3. If it asks for endpoint details, provide:
   - Candidate: base URL, chat path, model, API key
   - Judge: base URL, chat path, model, API key
4. The agent will run:
   - `npm install`
   - `node cli/gmlp-auditor.js smoke`
   - And it will wait for your confirmation before starting tests.
5. Read results under:
   - `reports/`

## Manual Mode (No Agent)

If you just want the CLI:

1. `cd <this-repo>`
2. `npm install`
3. `node cli/gmlp-auditor.js setup`
4. `node cli/gmlp-auditor.js smoke`
