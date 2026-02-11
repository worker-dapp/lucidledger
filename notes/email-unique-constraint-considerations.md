# Email UNIQUE Constraint Considerations

## Current State

The `email` column has a UNIQUE constraint in both the `employee` and `employer` tables. The `phone_number` column does not. Neither is used for identity resolution — wallet address is the sole identity key. Privy enforces credential uniqueness at the auth layer (OTP verification rejects linking an email or phone already claimed by another account).

## Potential Problem

If User A abandons their account (Privy account deleted or email unlinked) but their database record persists, and User B later creates a new Privy account with User A's old email:
- User B gets a new wallet, isn't found in the DB, goes to onboarding
- `createEmployee`/`createEmployer` fails because User A's stale record still holds that email
- User B sees a generic error: "Failed to update profile. Please try again."

This is unlikely but possible. Email addresses are more stable than phone numbers, so stale records with orphaned emails should be rare.

## Current Workaround

Manual DB intervention:
1. User reports they can't create a profile
2. Team queries DB for the record with that email
3. Confirms old record is abandoned (wallet doesn't match any active Privy user)
4. Deletes the old record or clears its email field
5. User retries

## Options If This Becomes an Issue

1. **Leave as-is** — handle manually when it occurs. Appropriate at current scale.
2. **Drop the UNIQUE constraint on email** — aligns email handling with phone. Eliminates the failure scenario entirely. The constraint provides no functional benefit since wallet is the identity key and Privy enforces email uniqueness at the auth layer. Tradeoff: loses a defense-in-depth layer.
3. **Build admin tooling** — add a feature to the admin dashboard to look up and clear stale records. More appropriate if this becomes recurring at scale.
