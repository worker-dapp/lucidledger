# Employee Signature Options (Proof of Contract Acceptance)

## Current state
- "Signing" is a DB status update (`application_status = 'signed'`) with `offer_accepted_at` timestamp.
- The worker wallet address is stored on-chain in `ManualWorkContract.worker`, but there is no cryptographic proof of acceptance.

## Option A: Off-chain signature (DB-backed proof)
**What it is**
- Prompt the worker wallet to sign a structured message (e.g., EIP-712 or plain text).
- Store the signature, message hash, and metadata (wallet address, job id, timestamp) in the DB.

**Pros**
- Low gas / no on-chain cost.
- Simple to implement; no contract changes.
- Can be verified anytime using the signature and message.

**Cons**
- Proof is not on-chain; relies on DB integrity.
- Requires message standardization and secure storage.

**Typical payload**
- Employer ID, employee ID, job ID, payment terms, chain ID, contract version, timestamp.

## Option B: On-chain signature (event or state)
**What it is**
- Add a `sign()` method to the contract; worker calls it once to record acceptance.
- Emit a `ContractSigned(worker, jobId, timestamp)` event and optionally store a `signedAt` field.

**Pros**
- Immutable on-chain proof with timestamp and signer.
- Independent of DB integrity.

**Cons**
- Requires contract upgrade/deploy + UI changes.
- Transaction required (even if gas is sponsored via AA).

## Recommendation
- Start with Option A to validate UX and data model quickly.
- Move to Option B when on-chain proof is required (regulatory or stronger trust model).

## Notes
- If both are implemented, off-chain signatures can be used for UX speed while on-chain events provide final proof.
