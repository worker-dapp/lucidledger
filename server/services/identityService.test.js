const { test } = require('node:test');
const assert = require('node:assert');
const { resolveRecord, isAdminRequest } = require('./identityService');

// A fake Sequelize model. Records the queries it receives and returns a preconfigured
// record for the subject lookup and/or the wallet lookup, so the tests stay
// deterministic and offline (no DB). It still answers wallet_address queries so that
// the tests below can prove no such query is ever issued.
function makeModel({ bySubject = null, byWallet = null } = {}) {
  const queries = [];
  return {
    queries,
    async findOne(query) {
      queries.push(query);
      if ('auth_subject' in query.where) return bySubject;
      if ('wallet_address' in query.where) return byWallet;
      return null;
    }
  };
}

function makeRecord(fields = {}) {
  return {
    ...fields,
    saveCount: 0,
    async save() { this.saveCount += 1; }
  };
}

test('resolves by auth_subject', async () => {
  const record = makeRecord({ id: 1, auth_subject: 'did:privy:abc' });
  const Model = makeModel({ bySubject: record });

  const result = await resolveRecord(Model, { authSubject: 'did:privy:abc' });

  assert.strictEqual(result, record);
  assert.strictEqual(Model.queries.length, 1, 'exactly one lookup');
  assert.deepStrictEqual(Model.queries[0].where, { auth_subject: 'did:privy:abc' });
});

test('a subject that matches nothing resolves to null', async () => {
  const Model = makeModel({ bySubject: null });
  assert.strictEqual(await resolveRecord(Model, { authSubject: 'did:privy:nobody' }), null);
});

test('no subject resolves to null without querying at all', async () => {
  const Model = makeModel({ bySubject: makeRecord({ id: 1 }) });

  assert.strictEqual(await resolveRecord(Model, { authSubject: null }), null);
  assert.strictEqual(await resolveRecord(Model, { authSubject: undefined }), null);
  assert.strictEqual(await resolveRecord(Model, {}), null);
  assert.strictEqual(Model.queries.length, 0, 'an unauthenticated request must not hit the DB');
});

// --- Regression: the wallet header must never influence identity ----------------
//
// Before this was fixed, resolveRecord fell back to matching wallet_address (taken from
// the client-set x-wallet-address header) whenever the subject lookup missed, and
// backfilled the caller's subject onto whatever row matched. Any authenticated user
// could therefore claim another user's record — permanently — by sending that user's
// wallet address, which is public on-chain. These tests pin the fallback as deleted.

test('a subject miss does NOT fall back to the wallet, even when a wallet row exists', async () => {
  const victim = makeRecord({ id: 99, auth_subject: null, wallet_address: '0xVICTIM' });
  const Model = makeModel({ bySubject: null, byWallet: victim });

  const result = await resolveRecord(Model, { authSubject: 'did:privy:attacker', walletAddress: '0xVICTIM' });

  assert.strictEqual(result, null, 'must not resolve to a record matched by wallet');
  assert.strictEqual(Model.queries.length, 1, 'no wallet query may be issued');
  assert.ok(!Model.queries.some((q) => 'wallet_address' in q.where), 'wallet_address must never be queried');
  assert.strictEqual(victim.auth_subject, null, 'must not stamp a subject onto another row');
  assert.strictEqual(victim.saveCount, 0, 'must not write to a record it did not resolve');
});

test('the module never reads a wallet address from the request', () => {
  // resolveEmployee/resolveEmployer build their args from req, so the forgeable input
  // could be reintroduced there without any resolveRecord test noticing. Exercising
  // them directly would require the real models (and a live DB), so assert on the
  // source instead: nothing in this module may read a wallet off the request.
  const raw = require('node:fs').readFileSync(__filename.replace(/\.test\.js$/, '.js'), 'utf8');
  // Strip comments: the module documents the removed wallet fallback in prose, and
  // describing it must not count as doing it.
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  assert.ok(!/x-wallet-address/.test(code), 'must not read the x-wallet-address header');
  assert.ok(!/wallet_address/.test(code), 'must not query by wallet_address');
  assert.ok(!/req\.(query|body)\.wallet/i.test(code), 'must not read a wallet from query/body');
});

test('resolveRecord accepts no wallet parameter — extra fields are inert', async () => {
  // Guards against a caller reintroducing a wallet hint by passing it through.
  const victim = makeRecord({ id: 98, auth_subject: null });
  const Model = makeModel({ bySubject: null, byWallet: victim });

  const result = await resolveRecord(Model, {
    authSubject: 'did:privy:attacker',
    walletAddress: '0xVICTIM',
    wallet: '0xVICTIM',
    email: 'victim@example.com'
  });

  assert.strictEqual(result, null);
  assert.strictEqual(victim.saveCount, 0);
});

// --- isAdminRequest -----------------------------------------------------------

test('isAdminRequest: true when the verified email is in ADMIN_EMAILS', () => {
  const prev = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = 'boss@x.com, Admin@Y.com';
  try {
    assert.strictEqual(isAdminRequest({ user: { email: 'admin@y.com' } }), true, 'match is case-insensitive');
    assert.strictEqual(isAdminRequest({ user: { email: 'boss@x.com' } }), true);
  } finally {
    process.env.ADMIN_EMAILS = prev;
  }
});

test('isAdminRequest: false for a non-admin email, a missing email, or unset config', () => {
  const prev = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = 'boss@x.com';
  try {
    assert.strictEqual(isAdminRequest({ user: { email: 'nobody@x.com' } }), false);
    assert.strictEqual(isAdminRequest({ user: {} }), false, 'no email → not admin');
    assert.strictEqual(isAdminRequest({}), false, 'no user → not admin');
    process.env.ADMIN_EMAILS = '';
    assert.strictEqual(isAdminRequest({ user: { email: 'boss@x.com' } }), false, 'unset ADMIN_EMAILS → nobody is admin');
  } finally {
    process.env.ADMIN_EMAILS = prev;
  }
});

test('isAdminRequest ignores a client-supplied wallet header', () => {
  // Admin used to be granted by matching the x-wallet-address header against an
  // ADMIN_WALLETS allowlist, which any caller could satisfy by sending an admin's
  // (public, on-chain) address. Both the allowlist and the header check are gone; this
  // pins that a header cannot grant admin no matter what it contains.
  const prev = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = 'boss@x.com';
  try {
    const req = { user: { email: 'nobody@x.com' }, headers: { 'x-wallet-address': '0xADMIN' } };
    assert.strictEqual(isAdminRequest(req), false, 'admin must not be grantable via a header');
  } finally {
    process.env.ADMIN_EMAILS = prev;
  }
});

// --- Regression: email matching must be equality, not a LIKE pattern ----------------
//
// Roles without an auth_subject column (mediator, recruiter) are still resolved by the
// Privy-verified email. Matching those with Op.iLike makes the *caller's own email* a
// LIKE pattern, and `_` — a legal and common local-part character — matches any single
// character, so a verified `j_ne.doe@x.com` resolves as the mediator `jane.doe@x.com`.
// Confirmed exploitable against the previous form before this was changed.

test('mediator email matching must not treat the caller email as a pattern', () => {
  const src = require('node:fs')
    .readFileSync(__dirname + '/../controllers/deployedContractController.js', 'utf8');

  // Strip comments first: the function documents the iLike hazard in prose, and
  // describing it must not count as doing it.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const start = code.indexOf('const resolveMediator');
  assert.ok(start !== -1, 'resolveMediator should exist');
  const resolver = code.slice(start, start + 400);

  assert.ok(!/iLike/.test(resolver), 'resolveMediator must not match email with iLike');
  assert.ok(/lower/.test(resolver), 'resolveMediator should compare lower(email) for equality');
});
