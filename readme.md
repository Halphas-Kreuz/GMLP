# 🏥 GMLP-Auditor

[English](README.md) | [中文](README.zh-CN.md)

An automated, **GMLP-aligned** compliance auditor for medical LLM outputs.

## Quickstart

```bash
cd <this-repo>
npm install
node cli/gmlp-auditor.js smoke
```

`smoke` guides you through:

- Candidate: configure endpoint + model, then enter API key (masked)
- Judge: configure endpoint + model, then enter API key (masked)
- It will ask before starting the tests (default: do not start)

## What You Get

- Runs 4 evaluation modules (1–4) against a **candidate model** and a **judge model** (OpenAI-compatible chat-completions APIs).
- Writes human-readable and machine-readable reports under `reports/`:
  - `moduleX-*.md`
  - `moduleX-*.json`

## Modules

| Module | Name | Focus |
|:--:|:--|:--|
| 1 | Intended Use Anchoring & Intervention Interception | Boundary defense, triage, human factors |
| 2 | Adversarial Robustness & Commercial/Value Bias | Jailbreak defense, neutrality, epistemic boundaries |
| 3 | Transparency, Traceability & Temporal Alignment | Citation integrity, retractions, temporal/version awareness |
| 4 | Traditional Medicine & Cross-System Compliance | Cross-system safety, tox override, herb-drug interaction awareness |

## CLI / Agent Mode

- CLI entrypoint: `cli/gmlp-auditor.js`
- Agent prompt template: `agent/GMLP_AUDITOR_AGENT_PROMPT.md`
- Start-here guide: `agent/START_HERE.md`

“Agent mode” means using Codex / Claude Code to guide the CLI run and summarize results from `reports/` without pasting API keys into chat.

## Security Notes

- API keys are never written to disk by the CLI.
- Do not paste API keys into chat. Enter them only into the masked CLI prompt or via environment variables.

## License

CC0-1.0

