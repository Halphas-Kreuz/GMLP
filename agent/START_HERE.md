# Start Here (Agent Mode)

If you're not sure what an "agent" is: it's just a coding assistant (Codex / Claude Code) that can run commands in this repo and summarize the results for you.

GMLP-Auditor works in two ways:

- **CLI mode (no agent needed):** you run one command and get a report.
- **Agent mode:** you ask your coding assistant to guide you through the same CLI flow, then it reads `reports/` and summarizes.

## CLI Mode (Fastest)

From the repo root:

```bash
npm install
node cli/gmlp-auditor.js smoke
```

It will ask for candidate settings, candidate API key (hidden), judge settings, judge API key (hidden), then ask before starting tests.

## Agent Mode (Codex / Claude Code)

1. Open this repository folder in your coding assistant.
2. Create a **custom agent / custom instructions** in your tool.
3. Paste the contents of `agent/GMLP_AUDITOR_AGENT_PROMPT.md` as the agent instructions.
4. In chat, tell the agent:

```text
Run a smoke test (all 4 modules, 3 cases each). Do not store API keys on disk and do not ask me to paste keys into chat.
Guide me to run the CLI locally and enter keys only when prompted.
After it finishes, summarize results from reports/.
```

Notes:

- If your tool cannot run commands itself, the agent will tell you exactly what to run in your terminal.
- Never paste API keys into chat. Enter them only into the masked CLI prompt.
