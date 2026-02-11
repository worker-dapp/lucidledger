# Wallet Loss Protection Options

## The Problem

Workers in developing countries frequently change SIM cards and may not be regular email users. If a worker loses access to the phone number or email they used to register with Privy, and that was their only linked credential, they lose access to their embedded wallet — and any funds in it.

Privy's key architecture is designed so that neither Privy nor our team can access user private keys. Their docs state: "if a user loses all provisioned devices and their additional factor, they will be locked out of their account." This is by design (security), but creates real risk for our target users.

## What Our Team Can and Cannot Do

- **App database**: Full control. We can update email, phone, wallet_address in employee/employer tables to point to a new Privy account.
- **Privy account**: Admin access via dashboard. Can manage/delete users.
- **On-chain contracts**: Immutable. Any signed smart contracts reference the old wallet address. Funds in the old wallet are unrecoverable without the original credentials.

## Options Evaluated

### Option 1: Require Multiple Linked Credentials (Low Effort, Preventive)

Make it mandatory during onboarding for users to link both email AND phone. This way, losing one credential doesn't lock them out — they can still authenticate via the other.

- Already supported by our account linking UI
- Change: make it required rather than optional
- Limitation: doesn't help if they lose access to both

While this seems like a "no-brainer", requiring email authorization for workers in LMICs may present a barrier to adoption. Discuss with prospective partners before implementing. One alternative could be to allow users to log in and set up an account with just a phone number, but then prompt them to add an email upon login each new session. 

### Option 2: Privy Cloud-Based Recovery (User-Level Only)

Privy offers cloud recovery via Google Drive or iCloud. A recovery secret is stored in the user's cloud account and can be used to recover the wallet on a new device.

- Limitation: this is a user-level feature only — no enterprise option to manage recovery secrets on behalf of users
- Limitation: our target users may not have Google/iCloud accounts
- Not a strong fit for our audience

### Option 3: Privy Delegated Actions + Auto-Sweep to Offramp (Recommended)

Privy's Delegated Actions let users grant our app permission to execute transactions on their behalf, even when offline. The user delegates once from their device and can revoke anytime.

**How it would work:**
1. Worker completes a contract, employer pays USDC to their smart wallet
2. Our backend (via delegated action) automatically sweeps the USDC to their mobile money or bank account via an offramp provider
3. Worker never holds a meaningful balance in the wallet

**Key details:**
- User must initiate delegation once from a provisioned device
- User can revoke consent at any time
- Neither Privy nor our app ever has access to keys — signing happens in secure enclaves
- Requires integration with a fiat offramp provider (e.g., Kotani Pay, Chipper Cash for African markets)

**Regulatory note:** Since the user owns the wallet and we're acting on pre-authorized instructions, this is the lower-risk regulatory model compared to holding funds ourselves. However, legal counsel should confirm whether auto-sweep triggers money transmitter obligations in target jurisdictions.

### Option 4: Compensation Fund with Historic Balance Tracking (Business Decision)

Set aside funds to compensate workers who lose wallet access. The blockchain permanently records all transactions, so proof-of-loss data is inherently available without building anything custom — we can query any wallet's USDC balance and full transaction history at any time.

- No engineering cost for the tracking side
- Requires a business decision about funding and claims process
- Could serve as a stopgap while auto-sweep is being implemented

### Option 5: Store Recovery Passwords on Behalf of Users (Not Recommended)

We could store a recovery password for users in our database.

- Makes us a de facto custodian of wallet keys
- Exposes us to significant liability if our database is breached
- Likely triggers money transmitter / custodial licensing requirements
- Penalties for operating without a license: up to $250K fines and 5 years imprisonment (18 U.S.C. 1960)
- Not recommended

### Option 6: Privy Server Wallets / App-Controlled Wallets

Privy offers server wallets — embedded wallets controlled from our backend via API. Keys are reconstructed in secure enclaves and never stored.

- Suitable for platform-level operations: treasury, escrow, payment routing
- If user funds flow through wallets we control, regulators may view us as a custodian
- Higher regulatory risk than delegated actions for worker-facing wallets
- Better fit for platform operations than individual worker wallets

## Recommended Approach

**Primary strategy: Delegated Actions + auto-sweep (Option 3)**
- Eliminates the "funds stuck in wallet" problem by making the wallet a transient pipe, not a store of value
- User retains ownership; we facilitate movement
- Lower regulatory risk than custodial models

**Combined with: mandatory multi-credential linking (Option 1)**
- Ensures users have a backup authentication path
- Low effort to implement

**Fallback: compensation fund (Option 4)**
- For edge cases where both strategies fail
- Business decision on funding

## Privy Pricing Context

- Free tier: 50K signatures/month, $1M transaction volume, up to 10K MAU
- Beyond free tier: $0.01 per signature
- Delegated actions and server wallets appear to fall under general signature-based pricing (not separate line items)
- Enterprise custom pricing available

## Next Steps

1. Contact Privy to discuss enterprise recovery options and confirm pricing for delegated actions at our expected scale
2. Consult a fintech/crypto attorney on whether auto-sweep triggers money transmitter obligations in target jurisdictions
3. Research offramp providers for target markets (mobile money integration)
4. Implement mandatory multi-credential linking as an immediate low-cost improvement
