const { test } = require('node:test');
const assert = require('node:assert');
const { PUBLIC_POSTING_FIELDS, toPublicPosting, publicPostingColumns } = require('./publicPosting');

const row = {
  id: '7', employer_id: '3', title: 'Construction worker', salary: '1.00',
  recruiter_id: '12', recruiter_fee_amount: '250.00', recruiter_fee_currency: 'USD'
};

test('the recruiter and the agreed fee are not in the public shape', () => {
  const out = toPublicPosting(row);
  assert.strictEqual('recruiter_id' in out, false);
  assert.strictEqual('recruiter_fee_amount' in out, false);
  assert.strictEqual('recruiter_fee_currency' in out, false);
});

test('the advert fields survive', () => {
  const out = toPublicPosting(row);
  assert.strictEqual(out.id, '7');
  assert.strictEqual(out.title, 'Construction worker');
  assert.strictEqual(out.salary, '1.00');
});

test('whether a recruiter is involved survives as a boolean', () => {
  // The worker's offer screen needs this to ask for the no-fees acknowledgement.
  assert.strictEqual(toPublicPosting(row).has_recruiter, true);
  assert.strictEqual(toPublicPosting({ ...row, recruiter_id: null }).has_recruiter, false);
});

test('a column nobody has classified stays private', () => {
  // The reason this is an allowlist: next year's column is not published by default.
  const out = toPublicPosting({ ...row, internal_margin: '0.15' });
  assert.strictEqual('internal_margin' in out, false);
});

test('accepts a model instance as well as a plain row', () => {
  const instance = { toJSON: () => row };
  assert.strictEqual('recruiter_fee_amount' in toPublicPosting(instance), false);
  assert.strictEqual(toPublicPosting(instance).title, 'Construction worker');
});

test('a missing posting stays null, so an optional include does not crash', () => {
  assert.strictEqual(toPublicPosting(null), null);
  assert.strictEqual(toPublicPosting(undefined), null);
});

test('no recruiter field is on the public list', () => {
  assert.deepStrictEqual(PUBLIC_POSTING_FIELDS.filter((f) => f.startsWith('recruiter')), []);
});

test('the SQL select list names columns and never selects the fee', () => {
  const sql = publicPostingColumns('jp');
  assert.strictEqual(sql.includes('*'), false);
  assert.strictEqual(sql.includes('recruiter_fee'), false);
  assert.match(sql, /jp\.title/);
  assert.match(sql, /\(jp\.recruiter_id IS NOT NULL\) AS has_recruiter/);
});
