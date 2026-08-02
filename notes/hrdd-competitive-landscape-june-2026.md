# HRDD Competitive Landscape & Product Opportunity
## Combined Research Note — June 24, 2026

This note synthesizes two parallel research conversations: one focused on the competitive landscape for HRDD solutions (Diginex, Ulula, eMin, and related tools), and one exploring crypto payment rails, Taiwan's regulatory environment, and migrant worker payment verification. Together they map the competitive white space for a new automated financial HRDD product.

---

## Part 1: Diginex and the HRDD Competitive Landscape

### What Diginex Does

Diginex (Nasdaq: DGNX) is a publicly traded UK-based RegTech company focused on ESG and supply chain due diligence. Their current product suite is branded **Risk-to-Remedy**, an end-to-end framework (announced June 2026) integrating three components:

- **LUMEN** — supply chain risk mapping and scoring. Identifies human rights risks across supplier tiers, generates pre-populated recommendations and compliance reports for brands.
- **APPRISE** — multilingual "worker voice" tool for anonymous digital worker interviews at scale. Originally developed by UN University Macau with The Mekong Club; Diginex acquired and commercialized it. Now deployed with 50,000+ workers across 15 countries.
- **The Remedy Project** (acquired consultancy) — specializes in grievance mechanisms and remediation. Acquired to fill the gap between risk identification and actual remedy.

Market context: the HRDD software market is estimated at $3.8B in 2025, projected to reach $9.6B by 2034, driven by EU CSDDD, CSRD, and similar regulation.

**Diginex's strategic positioning:** they sell to brands and enterprise procurement/ESG teams who need to satisfy mandatory due diligence obligations. The worker is primarily a data source (survey respondent) rather than a direct beneficiary.

### eMin — Diginex's Thai Fishing Deployment

**eMin** is a blockchain-enabled tool developed by Diginex in partnership with The Mekong Club, designed to combat modern slavery through the recruitment process. Its mechanism: employment contracts are recorded on an immutable blockchain ledger, giving workers a verifiable, tamper-proof record of what they agreed to.

Key case study: In 2019, Diginex signed a deal with **Verifik8** (a data intelligence provider for agribusiness) to integrate eMin into Verifik8's existing farm monitoring tools (Blue 8/Green 8), which were already deployed with 5,000 workers on Thai shrimp farms. A pilot ran in February 2019 at a Phuket shrimp farm, funded partly by the British Embassy.

Key quote from Diginex's head of government solutions: *"Migrant workers can now own their data and can easily access their own contracts using this tool."*

**Critical limitation:** eMin records what a worker agreed to. It does not compare actual wage payments against that contract, flag deductions, or enforce payment. It addresses the evidence layer, not the enforcement layer.

**Doc2Work** is a separate Diginex project (with Winrock International, Mars Petcare, USAID CTIP) — a mobile app helping Thai migrant fishers navigate documentation for legal status. Available in Thai, Khmer, Burmese. ~592 active users as of December 2021. This is a documentation/rights-awareness tool, not a wage protection tool.

### Ulula

Ulula is a worker voice platform that monitors key risk indicators (incurred recruitment fees, document confiscation, working/living conditions) via continuous remote surveys. Workers self-report via SMS, WhatsApp, voice, or app. It can surface wage theft — but only when workers choose to report it. There is no systematic contract-to-payment comparison.

Also relevant: **Quizrr** (active in Bangladesh garments via a UNCDF project) combines financial wellness tools with mobile surveys. Same model: worker-reported, not automated.

### EcoVadis, Sedex, etc.

Broader ESG ratings/audit platforms. Track supplier self-assessments and audit reports. No automated payment verification.

### The Fundamental Pattern

All incumbent tools — Diginex, Ulula, APPRISE, eMin, Quizrr — are built to answer: *"Can we demonstrate we did due diligence?"* That is a documentation problem. None of them answer: *"Were workers actually paid what their contracts say they're owed?"* That is a verification problem. The market has not been pushed to solve it because regulators have historically demanded proof of process, not proof of outcome.

---

## Part 1b: Diginex's Regulatory Response — Risk-to-Remedy (June 2026)

### The Regulatory Landscape Driving the Rollout

Diginex's June 2026 product expansion is explicitly a response to a convergence of enforceable due diligence laws. Their press release names the full stack:

- **UK Modern Slavery Act** — transparency reporting requirement (in force since 2015)
- **Australia's Modern Slavery Act** — mandatory reporting for large entities (in force since 2019)
- **Canada's Fighting Against Forced Labour and Child Labour in Supply Chains Act** — reporting and due diligence obligations (in force 2024)
- **German Supply Chain Due Diligence Act (LkSG)** — enforceable due diligence with fines (in force 2023, extended to smaller companies 2024)
- **EU Corporate Sustainability Due Diligence Directive (CSDDD)** — the most significant: imposes civil liability for supply chain harm, mandatory remediation, and applies to large companies operating in the EU
- **EU Forced Labour Regulation** — product ban mechanism: goods made with forced labor can be prohibited from the EU market

Diginex's framing is pointed: most compliance tools still rely on "supplier declarations and annual audits that fail to capture workers' lived experience, leaving a persistent gap between what companies declare and what is actually occurring." Risk-to-Remedy is positioned to close that gap with "worker-level evidence" and "regulator-ready reporting."

Non-compliance consequences they cite: product bans and market exclusion, regulatory fines, costly supplier transitions, reputational damage — "compounding losses that typically far exceed the cost of prevention."

### What Risk-to-Remedy Actually Is

Risk-to-Remedy is an integration of three existing Diginex components, not a new product from scratch:

1. **LUMEN** — supply chain risk assessment and mapping. Generates risk scores by supplier, flags high-risk tiers, pre-populates remediation recommendations.
2. **APPRISE** — direct worker engagement at scale. Multilingual anonymous digital surveys (50,000+ workers, 15 countries). Captures worker-level evidence of conditions.
3. **The Remedy Project** (acquired consultancy) — grievance mechanism design and remediation management. Handles the "what to do when something goes wrong" layer.

The integration point is the workflow: LUMEN surfaces a risk → APPRISE collects worker-level evidence to confirm or qualify it → The Remedy Project structures the remediation → the whole chain is documented in a "regulator-ready" output.

### The Six-Step Risk-to-Remedy Framework (Live)

Diginex's supply chain page reveals the full framework in detail — a six-step cycle:

1. **Supply chain risk assessment** — regulatory and human rights risk mapping, stakeholder needs assessment
2. **Tool customization and capacity building** — bespoke questionnaire design, worker survey development, staff training
3. **Data collection and analysis** (LUMEN + APPRISE) — risk scoring, triangulation across data sources, policy evaluation
4. **Investigation** — field investigation and on-the-ground assessment of flagged risks
5. **Risk mitigation and prevention** — improvement actions through LUMEN, supplier capacity building, remediation advice
6. **Report** — documentation of all actions taken to identify, mitigate, prevent, and remedy risk

**LUMEN** runs a five-stage supplier assessment: onboarding → questionnaire deployment → algorithmic scoring → dashboard/benchmarking across the full supplier portfolio. Output is a scoring percentage with automated improvement recommendations.

**APPRISE** scale: 600,000+ worker voices collected across 70 countries in 43 languages (website figure; press release cited 50,000 across 15 countries — likely cumulative total vs. a point-in-time figure).

**The Remedy Project** provides: risk assessment and due diligence system design; advisory and capacity building for suppliers; independent investigation and remediation; and prevention/system strengthening (embedding into grievance mechanisms and policies).

### Upcoming Enhancements (Announced, Not Yet Live)

Diginex announced a further feature wave coming after the June 2026 integration. Specific capabilities described:
- More efficient management of assessments and audits
- Better evidence collection and organization
- Improved monitoring of non-compliance and corrective actions
- Clearer decision-making records for regulators

These map directly to CSDDD's evidentiary requirements: civil liability means companies need to show not just that they identified a risk, but what they decided to do about it and whether they followed through. The fact that these features are *upcoming* rather than current is a meaningful gap — their current audit trail and evidence organization are weak.

**Their strategic framing:** "closing the gap between what companies declare and what they can demonstrate." This is a direct response to how CSDDD enforcement will work. But notably, "demonstrate" in their system still means "show we asked the right questions via surveys and questionnaires" — not "show workers were paid against contract terms." The evidentiary standard they're building toward remains a documentation standard, not an outcome verification standard.

### The Resulticks Acquisition (Corporate Strategy Signal)

Separately from the supply chain rollout, Diginex announced in April 2026 a proposed acquisition of **Resulticks** — an AI-powered customer engagement and data analytics platform serving enterprises in North America, Asia, and the Middle East. As of June 17, 2026, the deal was still pending (long-stop date extended to June 30, 2026).

Resulticks is not an HRDD or supply chain product. It is a customer data/omnichannel marketing intelligence tool. This signals that Diginex is pursuing a broader platform strategy beyond supply chain labor — likely bundling ESG reporting, supply chain due diligence, and AI-powered analytics into a unified enterprise RegTech platform. The acquisition also suggests they are under pressure to diversify revenue and build scale ahead of potential Nasdaq compliance concerns (referenced in the filing).

**Strategic implication for Lucid Ledger:** Diginex is moving toward becoming a broad ESG platform company, not doubling down specifically on labor rights or wage verification. Their supply chain work (Risk-to-Remedy) is one module within a larger stack. This means their attention and product development resources are spread across ESG reporting, carbon management, investment intelligence, and now customer engagement AI. The labor verification gap is unlikely to be their priority.

---

## Part 2: Crypto Payment Rails and Taiwan's Regulatory Environment

*(From parallel research conversation)*

### Crypto Legality in Taiwan

Cryptocurrency is legal in Taiwan but treated as a regulated "virtual commodity," not legal tender. Regulated VASPs (XREX, MaiCoin, BitoPro) allow USDC-to-TWD conversion and bank withdrawal, but operate a strict closed-loop system: the crypto account name must exactly match the linked traditional bank account name. Traditional payment providers (LINE Pay, etc.) cannot touch crypto.

### The Taiwan Fishing Sector Problem

Under Taiwan's Labor Standards Act and Fisheries Agency mandates, distant-water crew salaries must be paid fully and directly in legal tender (USD or TWD). Paying migrant fishers in USDC, or routing USDC through an automated conversion platform, is currently illegal.

**The KYC wall:** Migrant workers cannot clear KYC requirements to open VASP accounts. They lack long-term Alien Resident Certificates (ARCs) and local phone numbers required by Taiwan's Financial Supervisory Commission (FSC). Bypassing via unregistered P2P carries criminal penalties for money laundering and unlicensed money transmitting.

### Where Crypto Wages Work

Countries with the right regulatory conditions include Brazil (Pix system), UAE (VARA), and Switzerland. Many international companies use a **"crypto-in-transit"** model (Deel, Rise, BVNK): employer pays USDC → fintech intermediary converts → worker receives local fiat. In Taiwan, this is blocked unless the offshore platform establishes a registered local branch.

### The Dual-Track Alternative

To legally eliminate wage theft and create an auditable record for labor inspectors in Taiwan, a **dual-track system** may be more viable: use a private cryptographic ledger purely for recording data transparency, while moving actual money through traditional bank wires or government-approved migrant remittance apps (EUI, Welldone). This separates the "proof layer" from the "payment layer."

---

## Part 3: The White Space — Automated Financial HRDD

### What No Product Currently Does

Neither the crypto-native tools nor the HRDD survey platforms do the following:

1. **Contract-to-payment comparison**: Record the terms of an employment contract (wage rate, deductions, pay schedule), capture actual payroll data from an employer's banking/payroll system, compare the two, and flag discrepancies or illegal deductions — generating a tamper-proof audit record.

2. **Operational cross-reference**: Cross-reference wage payments against operational data (electricity consumption, facility output records, production weights) to detect whether payroll records are consistent with actual activity — identifying the "double bookkeeping" evasion strategy documented by the U.S. State Department's *Deceiving the Watchdogs* report (2023).

### The Closest Existing Model

The **Gulf Cooperation Council Wage Protection Systems (WPS)** — implemented in UAE, Saudi Arabia, and Qatar — are the most structurally similar to concept #1. WPS routes all salaries through approved banks, generates a Salary Information File, and allows regulators to monitor for late or missing payments. But:
- It is government infrastructure, not a corporate product
- It is jurisdiction-specific (GCC only)
- It monitors whether payment was made, not whether it matches contract terms
- Illegal deductions and underpayment against contract are invisible to it

The WPS model validates that governments will mandate this kind of infrastructure when pushed. The question is whether a private product can get there ahead of regulatory mandates elsewhere.

### Why This Gap Exists

Incumbent tools were built around the procurement/ESG team as customer — they want documentation. A contract-vs-payment comparison product serves the same customer but answers a harder question: actual outcome verification. Post-CSDDD, there is increasing regulatory pressure for companies to demonstrate outcomes, not just processes. That is the structural shift that could create demand for this product.

### Risk: Still in the Documentation Paradigm

Even a contract-vs-payment comparison tool is fundamentally a documentation product — it proves what happened, after the fact. It does not prevent wage theft at the moment of payment the way Lucid Ledger's escrow model does. The corporate product path trades prevention for easier adoption (no restructuring of payment flows required). That is a real trade-off to keep in mind.

---

## Part 4: Competitive Map Summary

| Product | Mechanism | Sector | Wage Theft Prevention? | Contract Verification? | Payment Verification? |
|---|---|---|---|---|---|
| Diginex LUMEN | Risk scoring, supplier surveys | Cross-sector | No | No | No |
| Diginex APPRISE | Worker voice surveys | Cross-sector | No (reports only) | No | No |
| Diginex eMin | Blockchain contract recording | Thai fishing/aquaculture | No | Yes (immutable record) | No |
| Diginex Doc2Work | Documentation app for migrant fishers | Thai fishing | No | No | No |
| Ulula | Worker voice surveys | Cross-sector | No (reports only) | No | No |
| Quizrr/UNCDF | Surveys + financial wellness | Bangladesh garments | No (reports only) | No | No |
| GCC WPS | Government payroll monitoring | Gulf states | Partial (timing only) | No | Partial (presence only) |
| Deel/Rise | International payroll for contractors | High-income tech workers | No | No | No |
| **Proposed product** | **Contract + payroll API + ledger** | **Supply chain migrant labor** | **No (audit only)** | **Yes** | **Yes** |
| **Lucid Ledger** | **Escrow + smart contracts** | **Migrant labor** | **Yes (structural)** | **Yes** | **Yes** |

---

## Part 5: Strategic Implications for Lucid Ledger

**Two distinct product theses are emerging** (consistent with the two-entity strategy identified in June 2026):

1. **Lucid Ledger (PBC)** — escrow-based prevention, blockchain-native, open source, worker-facing. Goes through labor orgs, worker centers, government mandates. Does not depend on corporate goodwill. Long timeline, impact funding path.

2. **HRDD Measurement/Verification product (LLC)** — contract-vs-payment comparison, payroll API integration, optional operational data cross-reference, audit-ready output. Sells to corporate compliance/ESG buyers. Rides CSDDD regulatory wave. Shorter path to revenue. Complementary: builds supplier data relationships and brand credibility that eventually create demand for Lucid Ledger's public infrastructure.

**Key differentiator from all existing tools:** automated, systematic comparison of what workers were promised vs. what they received, with a tamper-proof ledger record — not self-reported surveys. This is what auditors will need to satisfy evidentiary standards under CSDDD and similar regimes.

**Priority relationship to develop:** Shawn McDonald at Verité (previously expressed interest). Verité works extensively on recruitment fee and wage monitoring in supply chains and would be a strong partner or channel for both products.

**Next steps to consider:**
- Draft PRD for the contract-vs-payment middleware product
- Map which payroll/banking APIs are accessible in target jurisdictions (Taiwan, Thailand, Indonesia, Bangladesh)
- Interview HRDD practitioners on evidentiary standards — what proof does an auditor actually need?
- Explore whether the operational cross-reference (energy/output) idea is patentable or protectable as trade secret

---

## Key Sources

- [SeafoodSource — eMin/Verifik8 deal (2019)](https://www.seafoodsource.com/news/aquaculture/companies-ink-deal-to-use-blockchain-for-protecting-thai-aquaculture-sector-workers)
- [Diginex — Risk-to-Remedy expansion (June 2026)](https://www.globenewswire.com/news-release/2026/06/04/3306680/0/en/Diginex-Expands-Supply-Chain-End-to-End-Product-Suite-Amid-Accelerating-Regulatory-Pressure.html)
- [Diginex — Safe Migration for Migrant Fishers case study](https://www.diginex.com/projects/safe-migration-for-migrant-fishers)
- [IOM Thailand — Diginex blockchain deployment](https://thailand.iom.int/news/iom-thailand-diginex-deploy-blockchain-solutions-better-protect-migrant-workers)
- [Ulula — Migrant worker exploitation and worker voice](https://ulula.com/blog/worker-voice-technology-is-vital-for-effective-collective-action-against-migrant-worker-exploitation/)
- [State Dept — Deceiving the Watchdogs (2023)](https://www.state.gov/wp-content/uploads/2024/08/Deceiving-the-Watchdogs-Accessible-10.24.2023.pdf)
- [ILO — Profits and Poverty: Economics of Forced Labour (2024)](https://www.ilo.org/sites/default/files/2024-10/Profits%20and%20poverty%20-%20The%20economics%20of%20forced%20labour_WEB_20241017.pdf)
- [ILO — Wage Protection Guidance Note for Migrant Workers](https://www.ilo.org/sites/default/files/wcmsp5/groups/public/@ed_protect/@protrav/@migrant/documents/publication/wcms_878456.pdf)
- [Mercans — GCC Wage Protection System guide](https://mercans.com/glossary/wage-protection-system-wps/)
- [Winrock/USAID CTIP — Mars Petcare Thailand final report](https://winrock.org/wp-content/uploads/2022/05/USAID-CTIP-MARS-LAB-Final.pdf)
- [Diginex — Risk-to-Remedy press release, June 4 2026 (GlobeNewswire)](https://www.globenewswire.com/news-release/2026/06/04/3306680/0/en/Diginex-Expands-Supply-Chain-End-to-End-Product-Suite-Amid-Accelerating-Regulatory-Pressure.html)
- [Diginex — Resulticks acquisition extension, June 17 2026 (GlobeNewswire)](https://www.globenewswire.com/news-release/2026/06/17/3313385/0/en/Diginex-Announces-Extension-of-Long-Stop-Date-for-Proposed-Acquisition-of-Resulticks.html)
- [Diginex Supply Chain page](https://www.diginex.com/supply-chain)

---

## Part 1c: Analyst Summary — What Diginex's CSDDD Response Actually Is

The distinction between what Diginex has live and what it has announced matters for competitive positioning.

**What's live:** The Risk-to-Remedy six-step framework is an organizational repackaging of existing tools (LUMEN, APPRISE, The Remedy Project) into a structured workflow. The six steps are: (1) supply chain risk assessment, (2) tool customization and capacity building, (3) data collection and analysis, (4) investigation, (5) risk mitigation and prevention, (6) report. Each step maps to one or more existing tools. This is integration work, not new product development.

**What's announced but not shipped:** The four upcoming features — better audit management, better evidence organization, non-compliance monitoring, clearer decision-making records — are the features that CSDDD's evidentiary standard actually requires. Their absence from the current product is a meaningful gap.

**The scale figure discrepancy:** The press release cites 50,000 workers across 15 countries; the website says 600,000+ worker voices across 70 countries in 43 languages. The website figure is likely cumulative since APPRISE's inception; the press release figure may reflect active deployments. Either way, APPRISE has meaningful real-world scale.

**The core limitation that hasn't changed:** Diginex's tagline is "closing the gap between what companies declare and what they can demonstrate." But "demonstrate" in their system still means demonstrating *process* — that surveys were run, questionnaires were completed, risk scores were generated. It does not mean demonstrating *outcome* — that workers were paid what their contracts said they were owed. The evidentiary standard they are building toward remains a documentation standard, not an outcome verification standard. This is the gap a contract-vs-payment comparison product would fill, and nothing in Diginex's roadmap closes it.
