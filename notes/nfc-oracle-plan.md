# NFC Oracle Notes (ManualWorkContract + Factory)

## Current state (baseline)
- On-chain contract only stores: employer, worker, mediator, payment_amount, jobId, admin.
- Off-chain DB/UI stores: pay interval, job details, selected oracles, etc.
- Deployment uses WorkContractFactory (deploy + fund) and sets mediator to address(0).
- Only manual verification affects on-chain state today.

## Goal
Support NFC-based verification as an oracle signal without breaking existing flows.

## Design options
1) Off-chain oracle + on-chain confirmation (minimal change)
   - NFC scan produces an off-chain proof (tag ID + timestamp + location + signer).
   - Backend verifies proof and stores it in `oracle_verifications`.
   - Backend (as admin) calls on-chain function to update contract state.
   - Pros: quick to ship; consistent with current admin mediation model.
   - Cons: trust in backend; relies on admin key to write on-chain.

2) Oracle attestation + on-chain validation
   - NFC scan signed by a platform key or a dedicated oracle key.
   - Contract has `submitOracleProof(...)` verifying signature + replay protection.
   - Contract updates state to `Completed` or unlocks a payment window.
   - Pros: stronger trust model; auditable proofs on-chain.
   - Cons: more contract changes; must manage signer key and revocation.

## Recommended MVP path
- Start with Option 1. Keep the on-chain contract unchanged and wire NFC proof handling in backend.
- Add a clear audit trail: store proofs in DB and log the on-chain tx hash when admin resolves.

## Contract changes if we move to Option 2
- Add to ManualWorkContract:
  - `address public oracleSigner;` (or use admin to set signer)
  - `mapping(bytes32 => bool) usedProofs;` (replay protection)
  - `function submitOracleProof(bytes calldata proof, bytes calldata sig)`
  - Verify signature over (contractAddress, jobId, tagId, timestamp, amount, worker)
- Consider a per-contract nonce or per-tag nonce.
- Decide whether proof triggers `Completed` directly or just flags `verified`.

## Factory changes (if needed)
- If adding new constructor args (e.g., oracleSigner or pay frequency), update:
  - `WorkContractFactory.deployContract` and `deployBatch` args
  - Frontend `deployViaFactory.js` to pass the new args
  - DB schema for storing new on-chain fields

## Data model additions
- Store NFC tag metadata (tag ID, issuer, location, assigned worker/job).
- Store proofs in `oracle_verifications` with:
  - `verification_status` = pending/verified/failed
  - `verified_at`, `verified_by`, `tx_hash` (if on-chain)

## Frontend wiring
- In the contract wizard, treat NFC as an oracle type (already present in UI).
- Add a scanning flow (mobile or external) that writes proofs to backend.
- Show verification status on the employer/worker dashboards.

## Security notes
- NFC tags are clonable; use rotating challenges or app-signed payloads.
- Always include timestamp + contract address in proof payload.
- Rate-limit proof submissions; log all attempts for audit.

## Next concrete steps
1) Define NFC proof payload format (fields + signature scheme).
2) Add backend endpoint to receive and verify proof.
3) Decide if admin or mediator triggers on-chain completion.
4) Add UI status and logs for NFC verification.
