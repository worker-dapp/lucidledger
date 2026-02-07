# TODO: Employer Verification / Company Identity

## Problem

Currently, anyone can create an employer account with any company name. Multiple accounts can claim the same company (e.g., two "Atlas Meridian" employers with different emails/wallets). For a payment verification system, we need confidence that a wallet address actually belongs to the claimed employer.

## Why It Matters

- Workers need to trust they're signing contracts with legitimate employers
- Payment disputes could involve identity verification
- Prevents impersonation / fraudulent job postings
- May be required for compliance in some jurisdictions

## Possible Solutions

### 1. Domain-based Verification (LinkedIn model)
- Employer must verify email matches company domain (e.g., `@atlas-meridian.com`)
- Company pages linked to verified domains
- Pros: Familiar pattern, relatively easy
- Cons: Small businesses may not have custom domains

### 2. Business Registration Verification
- Require EIN, business license, or incorporation docs
- Manual or third-party verification service (e.g., Middesk, Stripe Identity)
- Pros: Strong legal identity proof
- Cons: Friction, cost, international complexity

### 3. On-chain Identity / Attestations
- Use ENS names or on-chain attestations (EAS, Gitcoin Passport)
- Employer's wallet linked to verified on-chain identity
- Pros: Web3 native, decentralized
- Cons: Adoption still limited

### 4. Deposit/Stake Requirement
- Employers stake funds to post jobs (refundable)
- Bad actors lose stake
- Pros: Economic disincentive for fraud
- Cons: Barrier to entry for legitimate small employers

### 5. Reputation System
- Employers build reputation over time (completed contracts, worker reviews)
- New employers flagged as unverified
- Pros: Self-regulating
- Cons: Doesn't prevent initial fraud

## Recommendation

For MVP: Add a "Verified" badge system with manual admin verification. Admins can mark employers as verified after reviewing business docs.

Post-MVP: Consider domain verification + on-chain attestations for a more scalable solution.

## Related

- Current model allows duplicate company names (Monster.com approach)
- Wallet address is unique per employer but not verified as belonging to that business
