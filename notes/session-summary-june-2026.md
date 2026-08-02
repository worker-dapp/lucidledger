# Session Summary — June 5-6, 2026
**Duration:** Extended working session
**Focus:** Customer discovery preparation — Tu Rinsche blog analysis, product strategy, competitive landscape

---

## What We Did

### 1. Set Up the Do the Diligence Blog Note System
Created a template and instructions for systematically analyzing Tu Rinsche's Substack series ("Do the Diligence") as ethnographic context for Lucid Ledger. One markdown file per post, saved in `notes/do-the-diligence-blog/`. Format: summary, Lucid Ledger relevance, people mentioned, books/resources, questions for further investigation.

### 2. Analyzed Posts 1–5
**Post 1 — Making the Business Case for Human Rights**
Key insights: HRDD practitioners are in a structural minority position inside companies; must translate moral imperatives into business language annually at budget time. No standard tooling or protocol exists (inferred, not stated — flagged as open question). Books from Tu's library identified from photo.

**Post 2 — HRDD Doesn't Need a New Strategy, It Needs Action**
Key insights: Clearest map of what HRDD work actually involves (six UNGP/OECD steps). Audits explicitly critiqued. Wage theft named as a concrete, measurable outcome. Worker feedback and grievance data named as monitoring inputs alongside audits.

**Post 3 — Why HRDD Is the Future of Business Risk Management**
Key insights: Explicit audit critique with firsthand experience (Tu worked at investigative NGO using journalistic methods). Critical distinction between external tools (CHRB, Verité, DOL reports — all externally produced) and internal tracking tools (completely absent). This is the product gap. Recruiters named as a monitoring target.

**Post 4 — Hi, I'm Tu Rinsche**
Personal background. Key details: worked on first-generation worker voice technologies at Disney; all major in-house roles at US-headquartered companies (Disney, Marriott, Starbucks, unnamed tech firm); Elliott School GWU alumna — warm outreach angle.

**Post 5 — Reporting is the Finish Line**
Key insights: CHRB methodology (2024 update, 7 measurement areas) used as internal self-assessment tool — potentially the organizing framework for a dashboard KPI system. CSDDD requires companies to demonstrate ongoing process but gives no guidance on how to construct the evidence trail. That measurement gap is the product opportunity.

### 3. Built the Master Interview Question List
Eleven themed sections covering: time/task distribution, data sources, internal tools, compliance/reporting, wage payments and contracts, recruiters, the continuous data feed question, organizational politics, biggest risks, regulatory divergence (US vs. EU), and technology. Saved at `notes/master-interview-questions.md`.

Key questions developed:
- "What are your KPIs?" (single best opener for Thesis 2 interviews)
- "Walk me through last week — was that typical?"
- "When your CFO asks 'is this working?', what do you say?"
- The continuous data feed hypothesis question (Section 7)
- Have you seen pay stubs with illegal deductions explicitly recorded?
- Bangladesh Accord / US liability-aversion question

### 4. Mapped the Competitive Landscape
**EcoVadis** (dominant player): questionnaire/attestation-based, annual reassessment, 360° Watch is media monitoring not operational data. Differentiation: transaction-based evidence vs. survey-based attestation.

**Verité**: investigative NGO, rigorous but bespoke and expensive. Not a technology product.

**Better Work (ILO/IFC)**: closest to factory-level wage data collection, but assessment-based, garment sector only, nonprofit.

**Worldly/Higg FSLM**: industry self-assessment standard, accepted by 100+ brands, but self-reported.

**Issara/Golden Dreams**: worker recruitment marketplace with reviews. No contract or payment recording.

**TextileGenesis, TrusTrace**: physical product traceability only, no labor compliance layer.

**ILO Digital Wages initiative**: upstream infrastructure for digitizing wage payments — directly relevant to Lucid's payment recording model.

### 5. Developed Product Architecture Concepts

**HRDD Dashboard:** Internal KPI and compliance management tool. Organized around CHRB methodology. Ingests supplier documents. CSDDD reporting. B2B SaaS.

**Lucid-lite / HRDD Platform:** Hiring + payroll system + audit function. On-platform payments as source of truth. Contracts provided to workers in their language (foundational — contract is the legal baseline for all other verification). Worker voice via integration. Five-layer architecture documented.

**Pay Stub Parsing / Wage Suppression Detection:** Automated document ingestion flagging illegal deductions (recruitment fees, deductions for services not provided — common on South Asian tea estates). Self-documenting violations: employers often record illegal deductions on pay stubs. Detects: explicit illegal deductions, structural suppression (net wage below minimum after deductions), pattern-based suppression (piece rate manipulation, misclassification).

**Product-Level Attestation:** ZKP-derived compliance certificates attached to shipments for customs (UFLPA, CSDDD). Third-party custody solves US liability problem. Plugs into EU Digital Product Passport architecture. Labor cost per unit as novel fraud signal. Full architecture saved at `notes/product-attestation-architecture.md`.

### 6. Crystallized the Two-Business Structure

**Business Thesis 1 — Lucid Ledger (PBC, with partners)**
Public blockchain infrastructure for labor market transparency. Wage escrow, public ledger, contract provision, recruitment marketplace. Impact funding path (IFC, USAID, EU Horizon, foundations). No near-term revenue. Academic fit — generates novel research data. Shawn MacDonald at Verité previously expressed partnership interest.

**Business Thesis 2 — HRDD Measurement & Dashboard Consultancy (LLC, solo)**
Fills the gap that neither EcoVadis nor Verité addresses: *"Is your HRDD program working, and how do you know?"* KPI framework design + measurement methodology + dashboard product. Consulting-led go-to-market (Phase 1: manual service; Phase 2: semi-automated tool; Phase 3: SaaS). Uses Manny's research design and data science skills. Near-term revenue path.

**Differentiation from EcoVadis:** EcoVadis scores suppliers. This measures whether your program produces outcomes. Different question, different buyer (HRDD practitioner not procurement), different methodology (outcome measurement not compliance scoring).

**Differentiation from Verité:** Verité finds violations. This tracks whether you're fixing them. Not investigative — research design and program evaluation.

### 7. Key Strategic Insights

- **The information vs. incentive problem:** Major brands may already know about wage suppression (tea plantations, fishing vessels) but continue sourcing anyway. Better data doesn't solve an incentive problem. Lucid's public ledger changes incentives by making evidence available to actors outside the brand (regulators, civil society) who can create enforcement pressure. The private dashboard helps brands manage information they may already have; Lucid changes who has access.

- **Platform vs. consulting service:** The evidence quality hierarchy: (1) payment flows through platform — unimpeachable; (2) worker confirms receipt independently; (3) employer CSV/SAP upload — vulnerable to manipulation. Worker voice via SMS is not payment verification — that requires independent verification, which is what blockchain provides.

- **Regulatory divergence:** US brands historically avoided binding HRDD commitments due to US tort liability (Bangladesh Accord precedent). A tool that creates documented records of supply chain knowledge could be seen by US general counsel as a liability landmine. Interview question: does legal ever block HRDD data collection?

- **Sector tiering:** Informal sector (construction, smallholder agriculture) = most vulnerable workers, no competing infrastructure, but no compliance budget. Semi-formal (seafood, tea) = pay stubs exist but incomplete. Formal (garments, electronics) = Better Work and EcoVadis already operating. Most commercially tractable: semi-formal sector for the consultancy; informal for Lucid's highest-impact use case.

- **Shawn MacDonald / Verité:** Priority interview. Validates both theses simultaneously. Already expressed Lucid partnership interest. For Thesis 2: does Verité get asked "how do we measure whether this is working?" and have no good answer? Come with questions, not a pitch.

### 8. Developed the MVP KPI Framework

Built a full KPI framework document (`mvp-kpi-framework.md`) organized around the CHRB 2026 methodology. Six MVP KPIs identified:

1. **Grievance volume, resolution rate & remedy rate** — CHRB Remedies (34% weighting, highest priority). Data: existing grievance system + worker voice.
2. **Supplier payment compliance** — CHRB Culture & Management (25%). Data: accounts payable records. Directly linked to downstream wage suppression.
3. **Supply chain disclosure coverage** — CHRB Culture & Management (25%). Data: brand's own supplier database. Currently only 24% of CHRB companies disclose.
4. **HRDD effectiveness tracking** — CHRB Due Diligence (25%). Meta-KPI: the dashboard itself IS the tracking mechanism CHRB Indicator 4.04 requires but doesn't specify how to build.
5. **Working hours & overtime compliance** — CHRB Policy Commitments (8%). Data: pay stubs and payroll records.
6. **Training coverage** — Phase 2 addition. Data: HR/LMS records.

**CHRB as the organizing framework:** WBA provides indicator-level CHRB scores via free public API. Dashboard pulls these alongside internal KPIs — the dashboard becomes the tool that lifts the CHRB score year over year.

**Reporting capabilities added:** Auto-generated reports for CSDDD compliance, CHRB self-assessment, annual HRDD disclosure, board/executive summary, investor ESG brief, supplier risk reports. Natural language generation via LLM integration (Claude API). Major time-saving value proposition.

**AI capabilities added:** Anomaly detection across multiple data sources simultaneously; predictive risk scoring per supplier; natural language report generation; salient risk identification; benchmarking against CHRB sector averages.

### 9. Clarified Data Source Architecture

Three-tier model:

**Tier 1 — Core (no external subscriptions):** WBA CHRB free API + brand's internal data (grievance, payroll, supplier list) + Manny's pay stub parsing methodology + AI reporting. The MVP minimum — deployable immediately.

**Tier 2 — Premium integrations (existing subscribers only):** EcoVadis API (brand's existing Premium credentials) + Ulula API (brand's existing subscription). Cannot be licensed independently and resold — brand must already pay for the full platform.

**Tier 3 — Supplier participation:** Pay stubs, contracts, time records.

**Ulula findings:** Ulula still operates as a live, independent platform (ulula.com) with its own dashboard, API, OWL app, and partner program — not fully absorbed into EcoVadis. Has a formal Technology Integration Partners program; already integrated with SupplyShift, SAP SuccessFactors, Microsoft Azure. API confirmed. No public pricing — enterprise negotiated. Covers Labor Recruitment as a sector (directly relevant to Lucid). Partnership path: apply as technology integration partner via ulula.com/partners.

**Verité CUMULUS correction:** More productized than previously described — a membership-based platform with its own private dashboard covering forced labor risk profiles, key risks, and workforce demographics. Answers "where is the risk?" not "is your program working?" Complementary, not competitive. Potential integration: CUMULUS risk data as a plugin in the dashboard.

### 10. Two Business Theses Formalized

Confirmed structure: two separate entities, separate governance, complementary.

- **Lucid Ledger (PBC):** Long-term public infrastructure. Academic fit. Impact funding. Shawn MacDonald (Verité) previously expressed partnership interest — priority to develop.
- **HRDD Measurement & Dashboard LLC (solo):** Near-term consulting → dashboard → SaaS. Differentiated from EcoVadis (outcome measurement vs. compliance scoring) and Verité (tracking whether you're fixing problems vs. finding them). First conversation with Shawn MacDonald should explore both.

---

## Files Created This Session

| File | Purpose |
|---|---|
| `do-the-diligence-blog/INSTRUCTIONS.md` | Template for blog note series |
| `do-the-diligence-blog/01-making-the-business-case.md` | Post 1 notes |
| `do-the-diligence-blog/02-hrdd-needs-action.md` | Post 2 notes |
| `do-the-diligence-blog/03-hrdd-future-of-risk-management.md` | Post 3 notes |
| `do-the-diligence-blog/04-hi-im-tu-rinsche.md` | Post 4 notes |
| `do-the-diligence-blog/05-reporting-is-the-finish-line.md` | Post 5 notes |
| `master-interview-questions.md` | 11-section interview question bank |
| `two-segment-strategy.md` | Two business theses north star document |
| `product-strategy-options.md` | Three businesses, competitive landscape, platform vs. consulting |
| `hrdd-platform-concept.md` | Lucid-lite architecture with partnership layer |
| `product-attestation-architecture.md` | ZKP attestation concept and technical architecture |
| `business-ideas-summary.md` | Consolidated summary of all product concepts |
| `distelhorst-research.md` | Greg Distelhorst paper list and reading priority |
| `mvp-kpi-framework.md` | Full KPI framework, CHRB mapping, data sources, reporting & AI capabilities, data architecture |
| `business-ideas-summary.md` | Consolidated summary of all product concepts and two-track strategy |

---

## Priority Actions Before Next Session

1. **Interview Shawn MacDonald** — validate both theses; explore Lucid partnership and Thesis 2 referral/co-development opportunity
2. **Interview Tu Rinsche** — warm outreach via Elliott School connection; validate measurement gap; ask "what are your KPIs?"
3. **Read CHRB 2024 methodology** — 7 measurement areas; candidate organizing framework for dashboard KPIs
4. **Read Distelhorst papers** — Nike and Gap papers first; understand what brand-level compliance data actually looks like
5. **Continue blog analysis** — Posts 6 onward (start new session)
6. **Check Better Work Transparency Portal** — understand what factory-level compliance data looks like in practice
