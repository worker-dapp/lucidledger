# TODO: Worker Earnings/Payment History Page

## Current State

Workers can see:
- "Paid" badge on completed contracts in Job Tracker (`/job-tracker`)
- USDC balance in wallet widget (SmartWalletInfo component in navbar)

Workers cannot see:
- Detailed payment history
- Transaction hashes / blockchain confirmations
- Total earnings summary
- Earnings by time period or employer

## Backend Infrastructure (Already Exists)

**Database**: `payment_transactions` table (migration 009) stores:
- `contract_id`, `amount`, `currency`
- `payment_type`, `status`
- `tx_hash`, `blockchain_confirmation`
- Timestamps

**API Endpoints**:
- `GET /api/payment-transactions?contract_id=X` — fetch payments for a contract
- `GET /api/payment-transactions/pending` — fetch pending payments
- `POST /api/payment-transactions` — create payment records

**API Service Methods** (in `client/src/services/api.js`):
- `getPaymentTransactions()`
- `createPaymentTransaction()`
- `getPendingPaymentTransactions()`

Currently only used by employer's WorkforceDashboard, not exposed to workers.

## Implementation Plan

1. **Create new page**: `client/src/EmployeePages/Earnings.jsx`
   - Route: `/earnings`
   - Add to employee navigation

2. **Features to include**:
   - Total earnings (all time)
   - List of payment transactions with:
     - Date
     - Amount (USDC)
     - Employer/job title
     - Status (completed, pending)
     - Link to BaseScan tx
   - Current USDC wallet balance
   - Filter by date range

3. **API changes needed**:
   - May need new endpoint: `GET /api/payment-transactions/employee/:employeeId`
   - Or filter existing endpoint by employee's deployed contracts

## Related Files

- `client/src/EmployeePages/JobTracker.jsx` — shows "Paid" badge
- `client/src/components/SmartWalletInfo.jsx` — shows USDC balance
- `server/controllers/paymentTransactionController.js` — backend logic
- `server/models/PaymentTransaction.js` — data model
