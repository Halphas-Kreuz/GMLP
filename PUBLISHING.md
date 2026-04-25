# Publishing (Repo-Style Agent)

This repo is designed to be used directly in coding assistants (Codex / Claude Code) as a "repo-style agent".

## Checklist Before Publishing

- Confirm no secrets are committed:
  - No `.env` file in git
  - No API keys inside `agent/`, `cli/`, `.gmlp-auditor/`, `.mediguard/`, or `reports/`
- Confirm `.gitignore` includes at least: `.env`, `node_modules`, `reports`
- Ensure docs contain no machine-specific absolute paths

## Publish Steps (GitHub)

1. Create a public GitHub repository.
2. Push this repo.
3. In the GitHub README, ensure the quickstart is:
   - `npm install`
   - `node cli/gmlp-auditor.js smoke`
4. Tell users who want "agent mode" to use:
   - `agent/START_HERE.md`
   - `agent/GMLP_AUDITOR_AGENT_PROMPT.md`

## Publish Steps (NPM)

See `NPM_PUBLISHING.md`.

## What Users Will Do

- CLI users run one command (`smoke`) and read `reports/`.
- Agent users paste the prompt, run the same command, then ask the agent to summarize `reports/`.
