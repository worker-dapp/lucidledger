const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const { verifyUsdcPayment } = require('./txVerificationService');

// Deterministic, offline tests. We build byte-accurate ERC-20 Transfer logs with ethers and feed
// them through a fake provider, so the full receipt-scan path is exercised without the network.

const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const EMPLOYER = '0x43D59B39673dd1E2214c02189f90758896fc3b75';
const RECRUITER = '0x93083f60F1877a6bA974d5eD88Bb74943deB8390';
const OTHER_TOKEN = '0x0000000000000000000000000000000000001234';
const TX = '0x' + 'ab'.repeat(32);

const transferIface = new ethers.Interface([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

// Build a receipt log for a Transfer(from,to,amountWholeUsdc) on `tokenAddress`.
const transferLog = (from, to, amountWhole, tokenAddress = USDC) => {
  const encoded = transferIface.encodeEventLog('Transfer', [
    from,
    to,
    ethers.parseUnits(String(amountWhole), 6),
  ]);
  return { address: tokenAddress, topics: encoded.topics, data: encoded.data };
};

// Fake provider whose getTransactionReceipt returns/throws whatever the test needs.
const providerReturning = (receipt) => ({ getTransactionReceipt: async () => receipt });
const providerThrowing = (err) => ({ getTransactionReceipt: async () => { throw err; } });

const receiptWith = (logs, status = 1) => ({ status, logs });

// Ensure the service has a USDC address configured for the tests that expect it.
process.env.USDC_ADDRESS = USDC;

const base = { txHash: TX, fromAddress: EMPLOYER, toAddress: RECRUITER, amount: '150' };

test('verified: exact matching USDC transfer', async () => {
  const provider = providerReturning(receiptWith([transferLog(EMPLOYER, RECRUITER, '150')]));
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'verified');
});

test('verified: address casing is ignored', async () => {
  const provider = providerReturning(receiptWith([transferLog(EMPLOYER, RECRUITER, '150')]));
  const r = await verifyUsdcPayment({
    ...base,
    fromAddress: EMPLOYER.toLowerCase(),
    toAddress: RECRUITER.toLowerCase(),
    provider,
  });
  assert.equal(r.status, 'verified');
});

test('verified: matching transfer found among unrelated logs', async () => {
  const provider = providerReturning(receiptWith([
    transferLog(EMPLOYER, OTHER_TOKEN, '150', OTHER_TOKEN), // wrong token, ignored
    transferLog(EMPLOYER, RECRUITER, '150'),                // the real one
  ]));
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'verified');
});

test('mismatch: wrong amount', async () => {
  const provider = providerReturning(receiptWith([transferLog(EMPLOYER, RECRUITER, '149')]));
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'mismatch');
});

test('mismatch: wrong recipient', async () => {
  const provider = providerReturning(receiptWith([transferLog(EMPLOYER, OTHER_TOKEN, '150')]));
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'mismatch');
});

test('mismatch: wrong sender', async () => {
  const provider = providerReturning(receiptWith([transferLog(OTHER_TOKEN, RECRUITER, '150')]));
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'mismatch');
});

test('mismatch: right amount but wrong token contract', async () => {
  const provider = providerReturning(
    receiptWith([transferLog(EMPLOYER, RECRUITER, '150', OTHER_TOKEN)])
  );
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'mismatch');
});

test('mismatch: transaction reverted (status 0)', async () => {
  const provider = providerReturning(receiptWith([transferLog(EMPLOYER, RECRUITER, '150')], 0));
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'mismatch');
});

test('mismatch: malformed tx hash (no network call needed)', async () => {
  const provider = providerThrowing(new Error('should not be called'));
  const r = await verifyUsdcPayment({ ...base, txHash: '0xnope', provider });
  assert.equal(r.status, 'mismatch');
});

test('mismatch: non-numeric amount', async () => {
  const provider = providerReturning(receiptWith([transferLog(EMPLOYER, RECRUITER, '150')]));
  const r = await verifyUsdcPayment({ ...base, amount: 'abc', provider });
  assert.equal(r.status, 'mismatch');
});

test('unverifiable: receipt not found (tx not mined)', async () => {
  const provider = providerReturning(null);
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'unverifiable');
});

test('unverifiable: RPC error is transient, not a rejection', async () => {
  const provider = providerThrowing(new Error('ECONNREFUSED'));
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'unverifiable');
});

test('unverifiable: missing wallet address on file', async () => {
  const provider = providerReturning(receiptWith([transferLog(EMPLOYER, RECRUITER, '150')]));
  const r = await verifyUsdcPayment({ ...base, toAddress: null, provider });
  assert.equal(r.status, 'unverifiable');
});

test('unverifiable: USDC address not configured (server misconfig, not client error)', async () => {
  const saved = process.env.USDC_ADDRESS;
  delete process.env.USDC_ADDRESS;
  const provider = providerReturning(receiptWith([transferLog(EMPLOYER, RECRUITER, '150')]));
  const r = await verifyUsdcPayment({ ...base, provider });
  process.env.USDC_ADDRESS = saved;
  assert.equal(r.status, 'unverifiable');
});

test('amount matching is exact — a 1-unit (0.000001 USDC) discrepancy fails', async () => {
  // Encode a transfer that is one base-unit short of 150.000000 USDC.
  const encoded = transferIface.encodeEventLog('Transfer', [
    EMPLOYER,
    RECRUITER,
    ethers.parseUnits('150', 6) - 1n,
  ]);
  const provider = providerReturning(
    receiptWith([{ address: USDC, topics: encoded.topics, data: encoded.data }])
  );
  const r = await verifyUsdcPayment({ ...base, provider });
  assert.equal(r.status, 'mismatch');
});
