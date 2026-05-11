# 🏥 GMLP-Auditor

`English` | [中文](README.zh-CN.md)

**严格遵循 GMLP 十条建议的医疗 AI 安全与合规性评测框架**  
*A GMLP-Aligned Framework for LLM Medical Safety & Compliance Evaluation*

> ⚡ 本框架完全开放，欢迎监管机构、标准组织及行业同行直接采纳或引用。

## 快速开始（推荐）

```bash
cd <this-repo>
npm install
node cli/gmlp-auditor.js smoke
```

`smoke` 会按顺序引导你：

- Candidate：填写参数 → 输入 API Key（隐藏输入）
- Judge：填写参数 → 输入 API Key（隐藏输入）
- 然后在开始测试前询问是否立即运行（默认不运行）

## 项目定位

**Good Machine Learning Practice（GMLP）** 是由美国 FDA、加拿大卫生部与英国 MHRA 于 2021 年联合发布、并于 2025 年经国际医疗器械监管机构论坛（IMDRF）正式定稿的 10 项指导原则。GMLP 覆盖 AI/ML 医疗设备全生命周期，代表了全球监管机构对医疗 AI 质量的共识框架。

然而，GMLP 是原则性、非强制性的高层指引，面向 LLM 医疗应用场景的**可执行评测标准**仍存在空白。

**GMLP-Auditor 填补了这一空白。** 本框架将 GMLP 十条原则逐一落地为**可量化、可复现、分层的结构化评分标准**，覆盖预期用途锚定、对抗鲁棒性、引文与时序真实性、跨传统医学体系安全等关键风险域。

## 评测模块总览

| 模块 | 名称 | 核心测试焦点 |
|:---:|:---|:---|
| **1** | 预期用途锚定与实质性干预拦截 | 边界防守、高危信号识别、信息降噪与人机交互设计 |
| **2** | 对抗鲁棒性与商业 / 价值偏见 | 越狱防御、商业中立、循证客观性与认知边界声明 |
| **3** | 透明度、溯源与时序对齐 | 引文真实性、撤稿与过时知识感知、残缺信息的置信度校准 |
| **4** | 传统医学与跨体系合规 | 辨证边界防守、现代毒理学强制阻断、中西医证据体系差异隔离 |

说明：本仓库当前以 `data/`、`prompts/`、`judges/` 的方式组织各模块的测试用例、审计 rubric 与评分器实现。

## CLI / Agent 用法

- CLI 入口：`cli/gmlp-auditor.js`
- Agent 指令模板：`agent/GMLP_AUDITOR_AGENT_PROMPT.md`
- 新手指南：`agent/START_HERE.md`

“Agent”在这里的含义：Codex / Claude Code 等编码助手，用来指导你运行 CLI、读取 `reports/` 输出并做总结（不会要求你在聊天里粘贴 API Key）。

## 免责声明

本评测框架仅用于研究与开发辅助，不构成任何医疗建议，亦不能替代监管机构（如 FDA、NMPA）的正式审查与认证。评测结果不代表对具体产品的官方背书。

## 许可协议

本作品采用 CC0 1.0（公共领域贡献）许可。在法律允许的范围内，我们放弃所有著作权及相关权利，欢迎自由采纳、改编、引用。

