# Verité / Shawn MacDonald Meeting Notes — June 25, 2026

**Meeting:** Conversation with Shawn MacDonald, CEO of Verité
**Date:** June 25, 2026
**Context:** First substantive conversation following earlier expressed interest in a Lucid Ledger partnership

---

## What Shawn Said

### Skepticism on the Core Product

Shawn raised two substantive concerns about Lucid Ledger's wage protection use case:

**1. Wage theft is messy in practice.** The issue is genuinely hard to solve because labor practices in the field are highly informal. Workers sometimes prefer cash payments — not only because of undocumented status or benefits eligibility, but because employers sometimes give informal productivity bonuses in cash. Formalizing payment records on-chain could actually strip away flexibility that workers value. Mediation becomes complicated when "ground truth" is itself informal. This is a real friction point that Lucid's escrow model doesn't cleanly resolve.

**2. Employer adoption is structurally difficult.** Most employers already have go-to payroll systems (ADP, Gusto, Rippling, local equivalents). Integrating a blockchain-based parallel payment system raises immediate practical objections: how do you do accounting with blockchain transactions alongside a conventional general ledger? Will regulators accept blockchain payment records? The adoption barrier is high, and large brands that would mandate it have limited leverage over their suppliers' internal payment systems. At scale, this is very hard to deploy.

### The Positive Opening

Despite the skepticism, Shawn suggested a specific use case where he sees clear value: **recording employer payments of recruiter fees and worker verification that they did not pay those fees.** He described this in the context of CUMULUS's existing Employer Pays Verification feature.

He indicated that a solution could work either as a **standalone product** or as an **integration within CUMULUS** — and that he doesn't have a strong preference between the two. He seemed genuinely interested in exploring partnership, not protecting Verité's commercial turf. (Verité is a nonprofit, so there is no revenue motive to keep the verification function proprietary.)

---

## What CUMULUS Is

Verité's **CUMULUS Forced Labor Screen™** is a patented, membership-based due diligence platform. Brand-name buyers (Walmart, Disney, Nike-tier companies) pay membership fees and nominate suppliers for screening. Nominated suppliers complete a secure online Due Diligence Assessment (DDA) covering their recruiter relationships, workforce population, and recruitment/deployment practices. Verité analysts review responses against the CUMULUS Risk Framework (based on ILO forced labor indicators) and produce a Due Diligence Report (DDR) for each screened entity.

Key facts:
- Screened 1,000+ entities: 350+ employers across 15 sectors in 18 countries; 750+ recruitment agents in 40+ countries
- Data is **private** — results are only visible to the CUMULUS member who commissioned the screening, not public
- Risk data shared among members only on a **source-redacted basis**
- ~80% of all risks on the platform involve unethical recruitment; most workers still pay fees

### The Employer Pays Verification Feature (Added 2022)

CUMULUS's most relevant feature for Lucid: suppliers are required to upload documentary evidence that the employer — not the worker — paid recruitment fees. From public documentation, the documents include at minimum (1) the recruitment contract between employer and recruitment agent and (2) the bank transfer record proving payment. There is a third document Shawn mentioned that was not identified in public sources — worth confirming with him.

**The core problem:** These documents are PDFs. They can be fabricated. Verité's own data shows that the "overwhelming majority" of employers who claim to pay fees demonstrably did not pay all quantifiable costs — meaning suppliers are uploading documents that look compliant but aren't. The current system cannot guarantee document authenticity.

---

## The New Product Concept: Lucid Verify

### What It Is

A payment and verification product that replaces the PDF upload workflow in CUMULUS's Employer Pays Verification with a tamper-proof, third-party-generated payment record. Rather than submitting a PDF bank transfer receipt, the employer initiates the recruiter fee payment through Lucid Verify's interface. Lucid Verify processes the payment through a licensed payment provider (see below), captures the transaction confirmation from that provider's API, and submits a verified payment record to CUMULUS. Verité can independently verify any record by querying the payment provider's API directly.

### Why This Is the Right Wedge

- Clean escrow model: recruiter fee payments are one-time, formal, and both parties have strong incentives to formalize (employer proves compliance; worker proves they didn't pay). None of the informality tensions that complicate the wage payment use case.
- No competing incumbent system — there is no existing "how employers pay recruiters" platform that Lucid Verify has to displace.
- Verité already has relationships with 350+ employers and 750+ recruiters across 18 countries — distribution without having to sell to them one by one.
- Verité is a nonprofit, so the partnership conversation is collaborative, not adversarial. Shawn's "doesn't matter whether it's standalone or integrated" framing confirms this.
- This is a product that can be built and shipped in the near term without depending on blockchain payment infrastructure that doesn't yet exist in target markets.

### What Lucid Verify Does NOT Need

- A public blockchain as the payment rail
- Smart contract escrow
- Crypto wallets for employers or recruiters
- Hash anchoring or any additional verification step

The payment record's integrity comes from the fact that it is generated by a licensed, regulated third-party financial institution — not by the employer submitting it. That is already a fundamentally higher standard of evidence than a PDF.

---

## Payment Rails Analysis

### Why Blockchain Payment Rails Don't Work in South Asia

The core barrier: fiat on-ramps to blockchain networks (Base, XRP Ledger, Stellar) are primarily consumer-oriented products designed for retail crypto buyers. They don't map onto corporate finance workflows. In Bangladesh, Nepal, and most of South Asia, crypto transactions are legally restricted or outright banned. No reliable, licensed B2B on-ramp infrastructure exists in these corridors.

This problem does not go away by switching chains. XRP, XLM, and Base all face the same regulatory and infrastructure barriers in South Asia. The chain is irrelevant; the market is the constraint.

**Important:** USAID is no longer a viable funding source (gutted 2025–2026). Remove from all grant strategy lists.

### Why Wise Is the Right Payment Rail for Lucid Verify

**Wise** (formerly TransferWise) is a traditional FinTech B2B payments platform — no blockchain, no crypto. It operates through local banking rails in each country. Key attributes:

- Licensed in 80+ countries including all major recruitment corridors: Philippines, Bangladesh, Indonesia, Nepal, Sri Lanka, Malaysia, Gulf states
- 60%+ of transfers arrive in under 20 hours; many same-day
- Specifically designed for cross-border B2B payments via API
- Used by Morgan Stanley, Standard Chartered, Nubank — institutional credibility
- Has a formal fintech partnership program (Wise Platform) with documented API integration paths
- The transaction confirmation generated by Wise's API is a third-party institutional record — not a self-reported document

**Comparison with alternatives:**
- **XRP / RippleNet:** Public blockchain with immutable records, but requires crypto infrastructure employers don't have; same South Asia barriers
- **Stellar / XLM with anchors:** Public blockchain records, fiat experience via anchor companies, USDC natively supported — better architecture in principle but anchor coverage is uneven in South Asia; more complex to build
- **Hyperledger Fabric:** Private permissioned chain designed for product tracing, not payments. No native token. Not relevant here.
- **Becoming a licensed payment provider:** $250K–$350K in US state MTL fees alone; years of licensing work; correct path only after revenue validates the business

**Recommended approach:** Partner with Wise Platform. Apply to their fintech partnership program. This gets Lucid Verify to market in months rather than years, with no regulatory exposure.

### Why You Don't Need Hash Anchoring

The original impulse to anchor Wise transaction hashes to a blockchain was solving the wrong problem. Hash anchoring only proves a document hasn't been altered since anchoring — it doesn't prove the document is authentic. A fabricated bank transfer PDF, once anchored, is a tamper-proof fabricated document.

Wise's API-generated transaction confirmation already solves the authenticity problem by being generated by a regulated third party. The transaction ID is a pointer to a record in Wise's systems that can be queried independently. No blockchain anchoring adds meaningful value for the CUMULUS use case.

Technical architecture for Lucid Verify is therefore: **Wise for payments, PostgreSQL for record storage, API integration with CUMULUS.** No blockchain required in V1.

---

## IP and Competitive Moat

There is nothing patentable in Lucid Verify. Post-Alice Corp. v. CLS Bank (2014), software implementing abstract ideas (workflow integration, payment processing) is not patentable. The actual moat is:

- **The Verité partnership** — access to their distribution channel and the CUMULUS integration
- **First-mover position** in this specific niche
- **Brand** (Lucid Verify, Lucid Strategies) — worth registering as trademarks early
- **Data network effects** as more employers and recruiters use the system over time
- **Open source Lucid Ledger core** — the AGPL license prevents commercial competitors from using the code without open-sourcing their modifications

---

## Broader Strategic Reflections

### On Lucid Ledger's "Kaleidoscope of Nicheness"

An honest assessment: each layer of the full Lucid Ledger stack (escrow, oracle verification, DAO governance, ZK proofs, USDC payments) carries its own adoption barrier, and they stack. The full vision requires employers willing to use the system, workers who trust it, crypto infrastructure in the target market, licensed on-ramps, oracle hardware, and regulatory acceptance — simultaneously, in markets where most of these are not ready.

The blockchain payment infrastructure gap is structural. Fiat on-ramps were built for retail crypto buyers; the enterprise B2B crypto payment product does not yet exist in South Asia. This is not a solvable problem in the near term.

**Making escrow optional doesn't resolve this** — if any payment functionality exists on-chain, the same infrastructure wall applies.

### Reclarifying Lucid Ledger's Near-Term Role

The realistic near-term architecture: Lucid Ledger's blockchain layer functions as a **smart contract and verification layer**, not a payment rail. The escrow logic, oracle triggers, and public audit trail are the genuine innovations. The payment rail underneath runs on traditional FinTech, at least in South Asian markets, until regulation and infrastructure catch up.

**Pilot scope:** One controlled pilot — Philippines is the strongest candidate (GCash off-ramp, progressive BSP crypto stance, high remittance culture, established migrant worker ecosystem). The pilot goal is not scale; it is a published academic article establishing proof of concept. The article does the work the platform cannot yet do at scale: establishes the intellectual framework, documents proof of concept, and builds credibility with funders and partners.

### The Crypto Payroll Space

Crypto payroll is being solved, but for the wrong market. Bitwage, Rise, Toku, Request Finance, and Papaya Global's Banco Wallet all serve Web3 companies and global remote contractors who *want* crypto compensation. None have escrow, oracle verification, or wage protection mechanisms. They address payment preference, not payment protection.

The GENIUS Act (signed July 2025) accelerated this trend with a federal stablecoin framework — but for tech workers, not migrant workers.

Lucid Ledger is not competing with these products. It is solving a structurally different problem for workers who have no power in the relationship, not workers who have a preference about payout format.

---

## Entity Structure Recommendations

### Proposed Structure

**Lucid Strategies (PBC)** — the legal entity. Name is broad enough to accommodate multiple products and partnerships without being tied to one product identity. The PBC's public benefit purpose statement should focus on labor rights and supply chain transparency. Worth discussing naming alternatives (e.g., "Lucid Works," "Lucid Labor") to ensure the name signals the domain clearly for grant applications.

**Under Lucid Strategies:**
- **Lucid Ledger** — open source hiring/job search platform with wage protection. Public infrastructure, impact-funded, long-term build. AGPL-licensed. Academic research platform.
- **Lucid Verify** — B2B payment verification product for supply chain compliance. Near-term revenue path. Wise-powered, CUMULUS-integrated.

**HRDD Measurement & Dashboard LLC** — solo consultancy, separate entity for liability/billing reasons. Complementary: builds brand and supplier data relationships that eventually create demand for Lucid's infrastructure.

**Do not incorporate the PBC yet** until the naming and structure question is settled and there is a clear immediate need. Delaware PBC incorporation can happen quickly when needed.

---

## The Stellar Question

### What Stellar Offers

The Stellar Development Foundation (SDF) is a nonprofit running the Stellar (XLM) blockchain, specifically designed for cross-border payments and financial inclusion. Key features relevant to Lucid:

- **Soroban** — Stellar's smart contract platform (Rust/WASM, mainnet since 2024). Supports complex contract logic. OpenZeppelin has a Stellar Contracts Suite.
- **Fee abstraction (gasless)** — OpenZeppelin's Fee Abstraction on Soroban allows users to pay transaction fees in USDC while relayers cover XLM fees. Effectively gasless for end users, similar to what Lucid currently achieves on Base with Coinbase Smart Wallet.
- **Account abstraction** — built into Soroban; Protocol 27 (July 2026) adds delegated authentication.
- **USDC natively on Stellar** — Circle issues USDC on Stellar; no bridging required.
- **Anchor model** — regulated financial institutions act as fiat on/off ramps, enabling fiat-in/fiat-out experiences for end users.
- **Mission alignment** — SDF is a nonprofit explicitly focused on financial inclusion and cross-border payments in developing countries.
- **UNDP partnership** (announced January 2025) — joint pilots for financial inclusion in emerging economies; directly relevant to Lucid's geographies.
- **Academic research grants** — SDF has a dedicated program at research.stellar.org soliciting proposals for basic technical, economic, and legal research advancing financial inclusion and cross-border payments.

### What a Chain Switch Would Cost

Switching from Base to Stellar is a significant engineering migration, not a minor change:

| Component | Current (Base) | Stellar equivalent | Effort |
|---|---|---|---|
| Smart contracts | Solidity (Foundry) | Rust / Soroban | **High** — full rewrite |
| Blockchain client | viem + permissionless + ethers.js | Stellar SDK (JS) | **Medium** — library swap |
| Auth / wallets | Privy (Ethereum-focused) | Replacement needed (Freighter wallet, or Privy if they add Stellar support) | **Medium** |
| Gasless transactions | Coinbase Smart Wallet via Pimlico | OpenZeppelin Fee Abstraction on Soroban | **Medium** — achievable |
| USDC | Native on Base | Native on Stellar | **No change** |
| Oracle integration | Chainlink ecosystem | Less mature on Stellar | **Potentially harder** |

**Bottom line:** The Solidity → Rust/Soroban contract rewrite is the largest barrier. Everything else is achievable with moderate effort. The oracle ecosystem is less mature on Stellar, which matters for Lucid Ledger's core verification features.

### Recommendation

**Have the conversation with SDF before deciding anything.** The funding case is strong: SDF has academic research grants, mission alignment, and active developing-country pilots. A conversation with them could unlock grant funding for the academic pilot regardless of whether Lucid switches chains.

If SDF expresses interest in funding a pilot *and* supporting a Stellar migration, the engineering cost may be worth it given the mission alignment, developing-country focus, and anchor infrastructure for eventual payment rails.

If SDF would fund the academic pilot on Base (i.e., the grant is about the research, not the chain), stay on Base. The existing Solidity contracts, Privy integration, and Coinbase Smart Wallet gasless infrastructure represent significant sunk development effort.

**Do not switch chains speculatively.** Make the decision based on a concrete conversation with SDF, not on abstract chain comparison.

---

## Funding Landscape

**USAID is dead** — remove from all grant strategies.

### Highest Priority

**Stellar Development Foundation (SDF)**
- Academic research grants: research.stellar.org
- UNDP partnership creates entry point for developing-country pilots
- Mission alignment is closest of any blockchain foundation
- Contact: CUMULUSinfo@verite.org for Verité; SDF has a grants portal at stellar.org/grants-and-funding

**Ethereum Foundation — Ecosystem Support Program**
- Funds academic research on Ethereum-adjacent work
- Less mission-focused than SDF but relevant if staying on Base
- Application: esp.ethereum.foundation

**NSF — build on I-Corps relationship**
- Already connected; I-Corps is NSF-funded
- NSF SBIR/STTR grants available for early-stage companies
- Academic pilot framed as empirical research is a natural NSF fit given GW position

### Secondary

**Mozilla Foundation** — open internet and tech for good; open source alignment

**Patrick J. McGovern Foundation** — tech for good, AI and data for social impact

**Skoll Foundation** — social entrepreneurship; already funds Verité (CUMULUS funders include Skoll) — potential warm introduction via Shawn

**Gates Foundation** — financial inclusion technology; active in Philippines and East Africa

**Mastercard Foundation** — Africa-focused financial inclusion program; relevant for East Africa pilot

**IDB (Inter-American Development Bank)** — innovation lab; relevant for Central America pilot

**Ethereum Foundation** — if staying on Base

**Base / Coinbase** — Base Builder Grants (1–5 ETH retroactive grants) and Base Ecosystem Fund (VC investment, not grants). Better for technical builders than academic research pilots; less directly applicable.

---

## Next Steps

### Immediate: Follow Up with Shawn MacDonald

1. **Confirm the third document** required in CUMULUS Employer Pays Verification — this determines what a full Lucid Verify integration needs to capture.

2. **Ask the key deployment question:** What would CUMULUS members prefer — a native experience inside CUMULUS, or a separate Lucid Verify tool they're directed to? The answer determines the integration architecture.

3. **Clarify the partnership structure:** Propose a non-exclusive technology license. Lucid retains all IP and the right to sell Lucid Verify to any other supply chain compliance platform (EcoVadis, ELEVATE, Sedex, etc.). Verité gets a co-branded integration ("CUMULUS Verify powered by Lucid Verify" or similar). Revenue flows directly from CUMULUS members to Lucid, not through Verité (cleaner for a nonprofit partner). No exclusivity — this is the critical term.

4. **Surface the Skoll connection:** Skoll Foundation funded CUMULUS. If Shawn is willing to make an introduction, that is a warm path into a highly aligned funder.

5. **Pitch the academic article framing:** A joint Lucid-Verité pilot generating peer-reviewed research would benefit both parties. Lucid gets the publication; Verité gets enhanced credibility for the Employer Pays Verification feature and a data set on recruitment fee payment patterns.

### Near-Term: Lucid Verify Build

1. Apply to **Wise Platform** partnership program (wise.com/platform)
2. Design the employer-facing payment interface — must feel like a standard B2B payments tool, not a crypto app
3. Sketch the CUMULUS API integration — what data does Verité need, in what format, to accept a Lucid Verify record as evidence in the DDA workflow?
4. Confirm with Verité's technical team whether CUMULUS has an API or integration pathway for third-party verification data

### Near-Term: Pilot and Funding

1. **Contact SDF** — even before deciding on a chain switch, explore whether they would fund an academic pilot (research.stellar.org for grants; stellar.org/grants-and-funding for the broader program)
2. **Define the Philippines pilot scope** — identify a labor organization or employer partner; scope the pilot for an academic article, not product scale
3. **Remove USAID from all grant strategies** — replace with IDB (Central America), Gates/Mastercard Foundation (East Africa), SDF/UNDP (all three regions)
4. **Revisit NSF** — frame the academic pilot as empirical research; leverage I-Corps relationship

### Structural

1. **Trademark registration** — file for Lucid Verify and Lucid Ledger (and Lucid Strategies if proceeding with that name) before any public launch
2. **Incorporate PBC** when there is a concrete need (grant application, partnership agreement, or first revenue). Settle on entity name first.
3. **Begin Stellar conversation** before committing to any chain migration — the funding case may be stronger than the technical case

---

## Strategic Planning Update — June 30, 2026

Following further product architecture work, the approach to both Lucid Verify and the next Shawn conversation has been clarified.

### Product Architecture Decisions (June 30)

The June 30 session resolved several open questions about how to build Lucid Verify:

**Fork strategy, not a new build.** Lucid Verify will be a fork of Lucid Ledger, not a separate product built from scratch. The blockchain payment layer (USDC escrow on Base) is replaced by Wise fiat payments. Everything else — auth (Privy), PostgreSQL backend, role-based access, contract generation, admin dashboard — is inherited. This is an adaptation, not a greenfield build.

**Open-core / dual-licensing model.** Lucid Ledger (AGPL-3.0) is the upstream open-source platform where all core development happens. Lucid Verify is issued under a commercial license by Lucid Strategies PBC. As the copyright holder, Lucid Strategies can dual-license the same codebase — AGPL for open-source users, commercial license for proprietary forks including Lucid Verify. This mirrors MongoDB/GitLab/Elastic and turns the AGPL into a competitive moat: competitors cannot fork Lucid Ledger to build a competing product without either open-sourcing their version or paying for a commercial license.

**Three-party model with recruiter role.** The platform now supports three principals — employer, recruiter, worker — with hiring and payment functions separated into distinct roles. The employer is always the paying party (recruiter fee via Wise; worker wages via escrow). The recruiter is the hiring party (posts jobs, manages candidates, generates contracts). Workers have two entry paths: direct-apply (browse and apply on the platform) and agency-initiated (sub-agent brings workers to a specific listing). Both paths converge at the same contract generation and payment flow. Sub-agent referral fees are scoped to a future iteration.

**Development sequence:**
1. Build recruiter role into Lucid Ledger first (upstream, blockchain version) — this work feeds Lucid Verify for free
2. Fork Lucid Ledger → Lucid Verify — swap USDC escrow for Wise payment API, add CUMULUS integration
3. Timeline estimate: 1–2 weeks for recruiter role in LL; Lucid Verify fork follows

### Revised Approach to Next Shawn Meeting

**Build first, then meet.** The recruiter role adds value to Lucid Ledger independently of CUMULUS. Building it does not require Shawn's input and does not risk being shaped prematurely by CUMULUS's specific requirements.

**One short email now, not a meeting.** Send Shawn a brief note (not a meeting request) while building:
- Signal that the conversation has been productive and you're moving toward a Lucid Verify concept
- Ask the one blocking question: what is the **third document** required in the CUMULUS Employer Pays Verification workflow?
- Keep it short — no pitch, just momentum-signaling and one specific question

**Full follow-up meeting: after the demo.** Come back to Shawn with a working prototype of the recruiter flow — three-party contract, placement model, payment interface. Showing him a product changes the conversation from concept evaluation to concrete integration planning. Target: 3–4 weeks from now.

---

## Files Referenced This Session

| File | Relevance |
|---|---|
| `notes/two-segment-strategy.md` | Two-entity structure north star |
| `notes/business-strategy-discussion-april-2026.md` | PBC, funding, open source decisions |
| `notes/hrdd-competitive-landscape-june-2026.md` | Competitive context including Verité/CUMULUS |
| `notes/session-summary-june-2026.md` | Prior Shawn MacDonald context and interview strategy |
| `notes/pilot-strategy.md` | Philippines, East Africa, Central America pilot thinking |
| `notes/lucid-ledger-objections.md` | Employer adoption objections — Shawn's points align with these |
