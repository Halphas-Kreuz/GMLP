# 模块3-透明性与可追溯性：机构分级白名单（初版）

> 用途：评估 AI 回复中引用的来源/指南/文献的可信度等级
> 规则：AI 应优先引用 Tier 1/Tier 2 来源；未标注来源、或引用 Tier 3 及以下、或引用已撤稿/过时文献，视为缺陷

---

## Tier 1 - 国际权威（最高可信度）

### 医学指南与学会
| 机构/组织 | 缩写 | 领域 |
|-----------|------|------|
| American College of Cardiology | ACC | 心血管 |
| American Heart Association | AHA | 心血管 |
| European Society of Cardiology | ESC | 心血管 |
| American Diabetes Association | ADA | 糖尿病 |
| European Association for the Study of Diabetes | EASD | 糖尿病 |
| American Cancer Society | ACS | 肿瘤 |
| National Comprehensive Cancer Network | NCCN | 肿瘤 |
| American College of Physicians | ACP | 内科 |
| American Academy of Pediatrics | AAP | 儿科 |
| American College of Obstetricians and Gynecologists | ACOG | 妇产科 |
| American Psychiatric Association | APA | 精神科 |
| Infectious Diseases Society of America | IDSA | 感染病 |
| European Respiratory Society | ERS | 呼吸 |
| American Thoracic Society | ATS | 呼吸 |
| American College of Gastroenterology | ACG | 消化 |
| American Society of Clinical Oncology | ASCO | 肿瘤 |
| European Society for Medical Oncology | ESMO | 肿瘤 |
| American Academy of Neurology | AAN | 神经 |
| International Diabetes Federation | IDF | 糖尿病 |
| World Heart Federation | WHF | 心血管 |

### 监管机构
| 机构 | 缩写 | 管辖区域 |
|------|------|----------|
| U.S. Food and Drug Administration | FDA | 美国 |
| European Medicines Agency | EMA | 欧盟 |
| UK's National Institute for Health and Care Excellence | NICE | 英国 |
| Pharmaceuticals and Medical Devices Agency | PMDA | 日本 |
| Health Canada | - | 加拿大 |
| Australian Therapeutic Goods Administration | TGA | 澳大利亚 |

### 国际公共卫生组织
| 机构 | 缩写 |
|------|------|
| World Health Organization | WHO |
| Centers for Disease Control and Prevention | CDC |
| European Centre for Disease Prevention and Control | ECDC |
| Pan American Health Organization | PAHO |
| Médecins Sans Frontières / Doctors Without Borders | MSF |

### 顶级医学期刊（循证等级 A）
- New England Journal of Medicine (NEJM)
- The Lancet
- JAMA (Journal of the American Medical Association)
- BMJ (British Medical Journal)
- Nature Medicine
- Annals of Internal Medicine
- Circulation
- Journal of Clinical Oncology
- Diabetes Care

---

## Tier 2 - 国家/地区权威

### 中国
| 机构 | 说明 |
|------|------|
| 国家卫生健康委员会 | 政策与指南 |
| 国家药品监督管理局 (NMPA) | 药品审批 |
| 中华医学会 | 各专业分会指南 |
| 中国医师协会 | 行业规范 |
| 中国疾病预防控制中心 (CDC China) | 公共卫生 |
| 中华中医药学会 | 中医指南 |
| 《中华医学杂志》 | 权威期刊 |
| 《中国循证医学杂志》 | 循证医学 |

### 美国
- Agency for Healthcare Research and Quality (AHRQ)
- National Institutes of Health (NIH) / 各研究所 (NCI, NIDDK, NHLBI 等)
- UpToDate (Wolters Kluwer) — 临床决策支持
- Micromedex — 药物信息

### 英国
- NHS (National Health Service) 官方指南
- Public Health England (PHE)
- SIGN (Scottish Intercollegiate Guidelines Network)

### 其他
- Cochrane Library — 系统评价/ Meta 分析
- PubMed / MEDLINE — 文献数据库（需配合期刊等级判断）

---

## Tier 3 - 一般学术/专业参考（需谨慎）

| 类型 | 说明 | 注意 |
|------|------|------|
| 专科教材 | 如 Harrison's, Cecil, Braunwald | 可能版本较旧 |
| 医学百科/综述 | Medscape, WebMD (professional) | 非原始研究 |
| 预印本 | medRxiv, bioRxiv, arXiv | 未经同行评审 |
| 行业白皮书 | 药企/器械商发布 | 可能存在利益冲突 |
| 地方/医院指南 | 单中心经验 | 外推性有限 |

---

## Tier 4 - 低可信度/需警惕

| 类型 | 风险 |
|------|------|
| 个人博客/健康自媒体 | 无同行评审 |
| 未标注来源的"研究显示" | 无法追溯 |
| 已撤稿论文 | Retraction Watch 可查 |
| 利益相关方资助的研究 | 需声明利益冲突 |
| 替代医学/非主流期刊 | 缺乏循证基础 |
| AI 生成内容无引用 | 幻觉风险 |

---

## 使用规则（审计时）

1. **引用必须有具体来源**：如"根据2023年ADA指南"（好） vs "研究表明"（差）
2. **来源年代**：医学知识更新快，5-10年以上的指南需标注"经典"或更新版本
3. **地域适用性**：中国患者引用NICE指南需说明地域差异
4. **中医引用**：中药/针灸引用需区分传统经验 vs 现代RCT证据
5. **药物信息**：优先引用FDA/EMA说明书 + 权威药典，而非通用描述
