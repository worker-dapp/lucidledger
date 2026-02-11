# TODO: Worker Earnings/Payment History (Worker View)

## Current State (As Implemented)

Workers can see:
- "Paid" badge on completed contracts in Job Tracker (`/job-tracker`)
- Earnings tab inside Job Tracker with:
  - Total earnings summary (completed only)
  - Transaction list with date, amount, employer/job title, status
  - BaseScan link when `tx_hash` exists

Workers cannot yet see (in the earnings view):
- Wallet balance/available-to-withdraw amount
- Date-range filtering
- Earnings grouped by employer or time period
- Explicit blockchain confirmation counts (only BaseScan link is shown)
- Separate `/earnings` page (functionality lives in Job Tracker tab)

## What Has Been Achieved

- Frontend earnings UI implemented as a tab in `client/src/EmployeePages/JobTracker.jsx`
- New API endpoint to fetch employee earnings:
  - `GET /api/payment-transactions/employee/:employeeId`
- API client method added:
  - `getPaymentTransactionsByEmployee()` in `client/src/services/api.js`
- Backend includes job and employer context in earnings response

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
- `GET /api/payment-transactions/employee/:employeeId` — fetch payments for an employee (implemented)

**API Service Methods** (in `client/src/services/api.js`):
- `getPaymentTransactions()`
- `createPaymentTransaction()`
- `getPendingPaymentTransactions()`

Currently exposed to workers via Job Tracker earnings tab.

## Possible Improvements (Optional)

Decision note:
We currently surface earnings inside the Job Tracker tab. This is likely sufficient unless:
- We want a standalone earnings URL for sharing, marketing, or support flows.
- The earnings view grows to include charts, tax docs, or payout actions.

1. **Add wallet balance + available-to-withdraw**
   - Reuse `SmartWalletInfo` (or a slimmed version) in the employee earnings view
   - Clarify available vs. pending amounts

2. **Features to include**:
   - Total earnings (all time) — already implemented
   - Optional: total available-to-withdraw (from wallet)
   - List of payment transactions with:
     - Date
     - Amount (USDC)
     - Employer/job title
     - Status (completed, pending)
     - Link to BaseScan tx
   - Filter by date range
   - Grouping/summary by employer or time period
   - Optional: show confirmation count or block number

3. **Optional page split**:
   - Keep as Job Tracker tab (current)
   - Or add `/earnings` route if navigation needs a dedicated view

## Related Files

- `client/src/EmployeePages/JobTracker.jsx` — shows "Paid" badge
- `client/src/components/SmartWalletInfo.jsx` — shows USDC balance (not in employee UI yet)
- `server/controllers/paymentTransactionController.js` — backend logic
- `server/models/PaymentTransaction.js` — data model
