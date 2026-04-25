# Using MediGuard As An Agent

This repo is designed so the **agent experience** is just a thin wrapper around a reliable local CLI.

## What The Agent Does

1. Collects (or confirms) candidate + judge endpoint settings (OpenAI-compatible).
2. Optionally stores API keys in a gitignored file via the wizard.
3. Runs `mediguard` evaluations.
4. Summarizes results and points you to the generated reports.

## Quickstart (Recommended)

1. Open this repo in your coding agent environment (Codex or Claude Code).
2. Ask the agent to run a smoke test:
   - “Run all modules with 3 cases each.”
3. If it asks for endpoint details, provide:
   - Candidate: base URL, chat path, model, API key
   - Judge: base URL, chat path, model, API key
4. The agent will run:
   - `node /Users/oblivion/Desktop/GMLP/cli/mediguard.js setup`
   - `node /Users/oblivion/Desktop/GMLP/cli/mediguard.js eval --all --limit 3`
5. Read results under:
   - `/Users/oblivion/Desktop/GMLP/reports/`

## Manual Mode (No Agent)

If you just want the CLI:

1. `cd /Users/oblivion/Desktop/GMLP`
2. `node cli/mediguard.js setup`
3. `node cli/mediguard.js eval --all --limit 3`

