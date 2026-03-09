-- Migration 023: Fix payment_transactions tx_hash unique constraint
-- A single on-chain dispute resolution transaction pays both worker and employer,
-- so tx_hash cannot be unique across payment_transaction records.
-- Also adds 'refund' as a valid payment_type for employer dispute refunds.

-- Drop the unique constraint on tx_hash (if it exists)
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_tx_hash_key;

-- Add 'refund' to the allowed payment types
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_type_check;
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_type_check
  CHECK (payment_type IN ('regular', 'bonus', 'penalty', 'final', 'refund'));
