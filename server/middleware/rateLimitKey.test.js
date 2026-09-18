const { test } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

// Offline, deterministic: a real ES256 keypair stands in for Privy's, and the jwks-rsa
// module is replaced in the require cache before authMiddleware is loaded, so the
// signature verification is genuine but no network call is ever made.
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const KID = 'test-key-1';
const APP_ID = 'test-app-id';
const ISSUER = 'privy.io';

const jwksPath = require.resolve('jwks-rsa');
require.cache[jwksPath] = {
  id: jwksPath,
  filename: jwksPath,
  loaded: true,
  exports: () => ({
    getSigningKey(kid, cb) {
      if (kid !== KID) return cb(new Error('Unable to find a signing key that matches'));
      cb(null, { getPublicKey: () => publicKey });
    },
  }),
};

process.env.PRIVY_APP_ID = APP_ID;
process.env.PRIVY_JWKS_URL = 'https://auth.privy.io/api/v1/apps/test-app-id/.well-known/jwks.json';
process.env.PRIVY_ISSUER = ISSUER;

const { rateLimitKey } = require('./authMiddleware');

function sign(claims = {}, { kid = KID, key = privateKey } = {}) {
  return jwt.sign(
    { sub: 'did:privy:alice', ...claims },
    key,
    { algorithm: 'ES256', issuer: ISSUER, audience: APP_ID, expiresIn: '1h', keyid: kid }
  );
}

function makeReq(token, ip = '203.0.113.7') {
  return { ip, headers: token ? { authorization: `Bearer ${token}` } : {} };
}

test('a valid token keys on the verified subject', async () => {
  const key = await rateLimitKey(makeReq(sign({ sub: 'did:privy:alice' })));
  assert.strictEqual(key, 'sub:did:privy:alice');
});

test('two users behind one NAT get separate buckets', async () => {
  const ip = '198.51.100.1';
  const alice = await rateLimitKey(makeReq(sign({ sub: 'did:privy:alice' }), ip));
  const bob = await rateLimitKey(makeReq(sign({ sub: 'did:privy:bob' }), ip));

  assert.strictEqual(alice, 'sub:did:privy:alice');
  assert.strictEqual(bob, 'sub:did:privy:bob');
  assert.notStrictEqual(alice, bob, 'a shared IP must not collapse users into one bucket');
});

test('the same user keys identically across requests, so the bucket accumulates', async () => {
  const first = await rateLimitKey(makeReq(sign(), '203.0.113.7'));
  const second = await rateLimitKey(makeReq(sign(), '203.0.113.99'));
  assert.strictEqual(first, second, 'the key must not vary with the source IP');
});

test('no token falls back to the IP', async () => {
  assert.strictEqual(await rateLimitKey(makeReq(null, '203.0.113.7')), 'ip:203.0.113.7');
});

test('the x-wallet-address header cannot name a bucket', async () => {
  // The defect being fixed: this header is client-set, so honouring it let a caller
  // rotate buckets freely, or drain another user's quota by naming their wallet.
  const req = {
    ip: '203.0.113.7',
    headers: { 'x-wallet-address': '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' },
  };
  assert.strictEqual(await rateLimitKey(req), 'ip:203.0.113.7');
});

test('a forged signature falls back to the IP, so junk tokens cannot mint buckets', async () => {
  const attacker = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  const forged = sign({ sub: 'did:privy:victim' }, { key: attacker.privateKey });

  assert.strictEqual(await rateLimitKey(makeReq(forged)), 'ip:203.0.113.7');
});

test('rotating unverifiable tokens does not produce fresh buckets', async () => {
  const ip = '203.0.113.7';
  const keys = new Set();
  for (let i = 0; i < 25; i += 1) {
    keys.add(await rateLimitKey(makeReq(`garbage-token-${i}`, ip)));
  }
  assert.deepStrictEqual([...keys], [`ip:${ip}`], 'all junk must land in the one IP bucket');
});

test('an unknown kid falls back to the IP', async () => {
  const token = sign({}, { kid: 'not-a-real-kid' });
  assert.strictEqual(await rateLimitKey(makeReq(token)), 'ip:203.0.113.7');
});

test('an expired token falls back to the IP', async () => {
  const token = jwt.sign(
    { sub: 'did:privy:alice' },
    privateKey,
    { algorithm: 'ES256', issuer: ISSUER, audience: APP_ID, expiresIn: '-1h', keyid: KID }
  );
  assert.strictEqual(await rateLimitKey(makeReq(token)), 'ip:203.0.113.7');
});

test('a token for another Privy app falls back to the IP', async () => {
  const token = jwt.sign(
    { sub: 'did:privy:alice' },
    privateKey,
    { algorithm: 'ES256', issuer: ISSUER, audience: 'some-other-app', expiresIn: '1h', keyid: KID }
  );
  assert.strictEqual(await rateLimitKey(makeReq(token)), 'ip:203.0.113.7');
});

test('a verified token with no sub falls back to the IP', async () => {
  const token = jwt.sign(
    { notASub: 'x' },
    privateKey,
    { algorithm: 'ES256', issuer: ISSUER, audience: APP_ID, expiresIn: '1h', keyid: KID }
  );
  assert.strictEqual(await rateLimitKey(makeReq(token)), 'ip:203.0.113.7');
});
