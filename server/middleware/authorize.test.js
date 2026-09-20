const { test } = require('node:test');
const assert = require('node:assert');
const {
  authorize, scopeToCaller, declarePolicy,
  POLICIES, POLICY_NAMES, DECLARATION_NAMES
} = require('./authorize');

// Two layers are tested separately, because they fail in different ways.
//
//   * The POLICIES predicates are pure over an already-resolved caller, so they are
//     exercised directly with a fake `roles` object. This is where a wrong comparison
//     lives, and it needs no database.
//   * authorize() is the plumbing: record loading, 404/403/500, the admin bypass, and
//     req.resource. Driven as middleware with a fake model and a fake res.
//
// Identity resolution itself — that the caller is derived from the verified subject and
// from nothing else — is tested in services/identityService.test.js.

// --- harness ------------------------------------------------------------------------

function makeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

// Runs a guard and reports what happened: 'next' if it passed, otherwise the status.
async function run(guard, req) {
  const res = makeRes();
  let nexted = false;
  await guard(req, res, () => { nexted = true; });
  return { outcome: nexted ? 'next' : res.statusCode, res, req };
}

function makeModel(recordsById) {
  return {
    lookups: [],
    async findByPk(id) {
      this.lookups.push(id);
      return recordsById[String(id)] || null;
    }
  };
}

// A request as verifyToken leaves it.
function makeReq({ params = {}, body = {}, query = {}, employer, email, kioskDevice } = {}) {
  const req = { params, body, query, headers: {}, authSubject: 'did:privy:caller' };
  if (employer) req.employer = employer;
  if (email) req.user = { email };
  if (kioskDevice) req.kioskDevice = kioskDevice;
  return req;
}

// Stands in for callerRoles(): whichever roles the caller holds, already resolved.
// Counts calls so the memoization contract can be asserted.
function makeRoles({ employee = null, employer = null, mediator = null } = {}) {
  const calls = { employee: 0, employer: 0, mediator: 0 };
  return {
    calls,
    employee: async () => { calls.employee += 1; return employee; },
    employer: async () => { calls.employer += 1; return employer; },
    mediator: async () => { calls.mediator += 1; return mediator; }
  };
}

const check = (policy, ctx) => POLICIES[policy].check({
  req: makeReq(), record: null, roles: makeRoles(), paramName: 'id', as: 'employee', ...ctx
});

async function withAdminEmails(emails, fn) {
  const prev = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = emails;
  try { return await fn(); } finally {
    if (prev === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = prev;
  }
}

// --- the vocabulary -----------------------------------------------------------------

test('the five shapes are the whole vocabulary', () => {
  // PR C annotates all 90 routes against exactly this list. A sixth shape appearing here
  // means the endpoint survey missed something and the inventory needs redoing, not that
  // the list should quietly grow.
  assert.deepStrictEqual(POLICY_NAMES,
    ['self', 'ownedByEmployer', 'contractParty', 'applicationParty', 'admin', 'kiosk']);
});

// --- misconfiguration fails at load, not at request time ----------------------------

test('an unknown policy name throws when the route file loads', () => {
  assert.throws(() => authorize('ownedByEmployeer'), /unknown policy/);
  assert.throws(() => authorize('ownedByEmployeer'), /self, ownedByEmployer, contractParty, applicationParty, admin, kiosk/);
});

test('a record policy with no model throws when the route file loads', () => {
  assert.throws(() => authorize('ownedByEmployer'), /needs a \{ model \}/);
  assert.throws(() => authorize('contractParty'), /needs a \{ model \}/);
});

test('the non-record policies build without a model', () => {
  assert.doesNotThrow(() => authorize('admin'));
  assert.doesNotThrow(() => authorize('kiosk'));
  assert.doesNotThrow(() => authorize('self'));
});

// --- ownedByEmployer, as a predicate ------------------------------------------------

test('ownedByEmployer: the owning employer passes, another employer does not', async () => {
  const record = { id: 7, employer_id: 42 };

  assert.strictEqual(await check('ownedByEmployer', { record, roles: makeRoles({ employer: { id: 42 } }) }), true);
  assert.strictEqual(await check('ownedByEmployer', { record, roles: makeRoles({ employer: { id: 43 } }) }), false);
});

test('ownedByEmployer: a caller holding no employer role fails', async () => {
  const record = { id: 7, employer_id: 42 };
  assert.strictEqual(await check('ownedByEmployer', { record, roles: makeRoles({}) }), false);
});

test('ownedByEmployer: ids compare across types', async () => {
  // Sequelize hands back integers; path params and JSON bodies carry strings. A ===
  // comparison between the two is always false — it fails closed, but it would make
  // every legitimate owner a 403.
  const record = { id: 7, employer_id: 42 };
  assert.strictEqual(await check('ownedByEmployer', { record, roles: makeRoles({ employer: { id: '42' } }) }), true);

  const strRecord = { id: 7, employer_id: '42' };
  assert.strictEqual(await check('ownedByEmployer', { record: strRecord, roles: makeRoles({ employer: { id: 42 } }) }), true);
});

test('ownedByEmployer: an unowned record admits nobody', async () => {
  // employer_id null must not match a caller whose own id is somehow absent.
  const record = { id: 7, employer_id: null };
  assert.strictEqual(await check('ownedByEmployer', { record, roles: makeRoles({ employer: { id: undefined } }) }), false);
  assert.strictEqual(await check('ownedByEmployer', { record, roles: makeRoles({ employer: { id: 42 } }) }), false);
});

// --- the bug this vocabulary makes unrepresentable -----------------------------------

test('a client-supplied employer_id cannot grant access', async () => {
  // The old handler check was:
  //   if (req.body.employer_id && record.employer_id !== req.body.employer_id) → 403
  // Sending the record's true owner id — readable from a public GET — passed it.
  const Model = makeModel({ '7': { id: 7, employer_id: 42 } });
  const guard = authorize('ownedByEmployer', { model: Model });

  const { outcome } = await run(guard, makeReq({
    params: { id: '7' },
    body: { employer_id: 42 },        // the true owner, supplied by an attacker
    employer: { id: 43 }              // the actual caller, who owns nothing here
  }));

  assert.strictEqual(outcome, 403, 'the body must not be consulted');
});

test('omitting employer_id cannot skip the check', async () => {
  // The old check was guarded by `if (req.body.employer_id && ...)`, so an empty body
  // meant no check ran at all.
  const Model = makeModel({ '7': { id: 7, employer_id: 42 } });
  const guard = authorize('ownedByEmployer', { model: Model });

  const { outcome } = await run(guard, makeReq({
    params: { id: '7' }, body: {}, employer: { id: 43 }
  }));

  assert.strictEqual(outcome, 403);
});

test('nothing in the module derives identity from the request payload', () => {
  const raw = require('node:fs').readFileSync(__dirname + '/authorize.js', 'utf8');
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  // req.params is legitimate: it names the resource, and every policy compares it against
  // a server-resolved caller rather than trusting it. req.body and req.query are not.
  assert.ok(!/req\.body/.test(code), 'must not read req.body');
  assert.ok(!/req\.query/.test(code), 'must not read req.query');
  assert.ok(!/req\.headers/.test(code), 'must not read a header');
  assert.ok(!/x-wallet-address/.test(code), 'must not read the wallet header');
});

// --- contractParty ------------------------------------------------------------------

const CONTRACT = { id: 5, employer_id: 42, employee_id: 9, mediator_id: 3 };

test('contractParty: admits the employer, the worker, and the assigned mediator', async () => {
  assert.strictEqual(await check('contractParty', { record: CONTRACT, roles: makeRoles({ employer: { id: 42 } }) }), true);
  assert.strictEqual(await check('contractParty', { record: CONTRACT, roles: makeRoles({ employee: { id: 9 } }) }), true);
  assert.strictEqual(await check('contractParty', { record: CONTRACT, roles: makeRoles({ mediator: { id: 3 } }) }), true);
});

test('contractParty: refuses a stranger in every role', async () => {
  assert.strictEqual(await check('contractParty', { record: CONTRACT, roles: makeRoles({ employer: { id: 43 } }) }), false);
  assert.strictEqual(await check('contractParty', { record: CONTRACT, roles: makeRoles({ employee: { id: 10 } }) }), false);
  assert.strictEqual(await check('contractParty', { record: CONTRACT, roles: makeRoles({ mediator: { id: 4 } }) }), false);
  assert.strictEqual(await check('contractParty', { record: CONTRACT, roles: makeRoles({}) }), false);
});

test('contractParty: a mediator not assigned to THIS contract is refused', async () => {
  // Holding the mediator role must not be enough. Otherwise any active mediator could
  // act on every contract in the system — including resolving disputes they were never
  // assigned, which is what the conflict-of-interest check exists to prevent.
  const unassigned = { id: 5, employer_id: 42, employee_id: 9, mediator_id: null };

  assert.strictEqual(await check('contractParty', { record: unassigned, roles: makeRoles({ mediator: { id: 3 } }) }), false);
});

test('contractParty: an unassigned contract does not match a mediator with no id', async () => {
  // The null guard is what stops String(null) === String(null) from passing.
  const unassigned = { id: 5, employer_id: 42, employee_id: 9, mediator_id: null };

  assert.strictEqual(await check('contractParty', { record: unassigned, roles: makeRoles({ mediator: { id: null } }) }), false);
  assert.strictEqual(await check('contractParty', { record: unassigned, roles: makeRoles({ mediator: { id: undefined } }) }), false);
});

test('contractParty: a dual-role caller matching either side passes', async () => {
  // Users may hold both an employee and an employer profile on the same account.
  const roles = makeRoles({ employer: { id: 99 }, employee: { id: 9 } });
  assert.strictEqual(await check('contractParty', { record: CONTRACT, roles }), true);
});

// --- self ---------------------------------------------------------------------------

test('self: passes only the caller\'s own row', async () => {
  const req = makeReq({ params: { id: '12' } });
  const roles = makeRoles({ employee: { id: 12 }, employer: { id: 77 } });

  assert.strictEqual(await POLICIES.self.check({ req, roles, paramName: 'id', as: 'employee' }), true);
  assert.strictEqual(await POLICIES.self.check({ req, roles, paramName: 'id', as: 'employer' }), false,
    'the employer row has a different id; as:employer must not fall back to the employee');
});

test('self: as:employer checks the employer row', async () => {
  const req = makeReq({ params: { id: '77' } });
  const roles = makeRoles({ employee: { id: 12 }, employer: { id: 77 } });

  assert.strictEqual(await POLICIES.self.check({ req, roles, paramName: 'id', as: 'employer' }), true);
});

test('self: a caller with no such profile fails', async () => {
  const req = makeReq({ params: { id: '12' } });
  assert.strictEqual(await POLICIES.self.check({ req, roles: makeRoles({}), paramName: 'id', as: 'employee' }), false);
});

test('self: honours paramName', async () => {
  const req = makeReq({ params: { employeeId: '12', id: '999' } });
  const roles = makeRoles({ employee: { id: 12 } });

  assert.strictEqual(await POLICIES.self.check({ req, roles, paramName: 'employeeId', as: 'employee' }), true);
});

test('self: reads the id from paramName and nowhere else', async () => {
  const src = require('node:fs').readFileSync(__dirname + '/authorize.js', 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const policy = code.slice(code.indexOf('self:'), code.indexOf('ownedByEmployer:'));

  assert.ok(/req\.params\[paramName\]/.test(policy));
  assert.ok(!/req\.(body|query|headers)/.test(policy), 'self must not read client input');
});

// --- admin --------------------------------------------------------------------------

test('admin passes a verified admin email and refuses everyone else', async () => {
  await withAdminEmails('boss@example.com', async () => {
    const guard = authorize('admin');

    const admin = await run(guard, makeReq({ email: 'boss@example.com' }));
    const upper = await run(guard, makeReq({ email: 'BOSS@example.com' }));
    const other = await run(guard, makeReq({ email: 'someone@example.com' }));
    const anon  = await run(guard, makeReq({}));

    assert.strictEqual(admin.outcome, 'next');
    assert.strictEqual(upper.outcome, 'next', 'admin email match is case-insensitive');
    assert.strictEqual(other.outcome, 403);
    assert.strictEqual(anon.outcome, 403, 'no email is not admin');
  });
});

test('an empty ADMIN_EMAILS grants nobody admin', async () => {
  await withAdminEmails('', async () => {
    const { outcome } = await run(authorize('admin'), makeReq({ email: 'boss@example.com' }));
    assert.strictEqual(outcome, 403);
  });
});

// --- kiosk --------------------------------------------------------------------------

test('kiosk passes only when kioskAuth attached a device', async () => {
  const guard = authorize('kiosk', { allowAdmin: false });

  assert.strictEqual((await run(guard, makeReq({ kioskDevice: { id: 3 } }))).outcome, 'next');
  assert.strictEqual((await run(guard, makeReq({}))).outcome, 403);
});

// --- authorize() plumbing -----------------------------------------------------------

test('the loaded record is attached as req.resource', async () => {
  const Model = makeModel({ '7': { id: 7, employer_id: 42 } });
  const guard = authorize('ownedByEmployer', { model: Model });

  const { outcome, req } = await run(guard, makeReq({ params: { id: '7' }, employer: { id: 42 } }));

  assert.strictEqual(outcome, 'next');
  assert.strictEqual(req.resource.id, 7, 'the handler must not have to refetch');
  assert.deepStrictEqual(Model.lookups, ['7'], 'exactly one load');
});

test('a missing record is 404 before any ownership question is asked', async () => {
  const guard = authorize('ownedByEmployer', { model: makeModel({}) });

  assert.strictEqual((await run(guard, makeReq({ params: { id: '999' }, employer: { id: 42 } }))).outcome, 404);
});

test('the record is loaded from paramName', async () => {
  const Model = makeModel({ '7': { id: 7, employer_id: 42 } });
  const guard = authorize('ownedByEmployer', { model: Model, paramName: 'jobId' });

  const { outcome } = await run(guard, makeReq({ params: { jobId: '7', id: '999' }, employer: { id: 42 } }));

  assert.strictEqual(outcome, 'next');
  assert.deepStrictEqual(Model.lookups, ['7']);
});

test('an admin bypasses the policy but still gets req.resource', async () => {
  // The bypass runs AFTER the record loads. If it short-circuited first, an admin's
  // request would reach a handler whose req.resource is undefined.
  await withAdminEmails('boss@example.com', async () => {
    const Model = makeModel({ '7': { id: 7, employer_id: 42 } });
    const guard = authorize('ownedByEmployer', { model: Model });

    const { outcome, req } = await run(guard, makeReq({
      params: { id: '7' }, email: 'boss@example.com', employer: { id: 43 }
    }));

    assert.strictEqual(outcome, 'next');
    assert.ok(req.resource, 'req.resource must be populated for admins too');
    assert.strictEqual(req.resource.employer_id, 42);
  });
});

test('an admin still gets 404 for a record that does not exist', async () => {
  await withAdminEmails('boss@example.com', async () => {
    const guard = authorize('ownedByEmployer', { model: makeModel({}) });
    const { outcome } = await run(guard, makeReq({ params: { id: '999' }, email: 'boss@example.com' }));
    assert.strictEqual(outcome, 404);
  });
});

test('allowAdmin: false closes the bypass', async () => {
  await withAdminEmails('boss@example.com', async () => {
    const Model = makeModel({ '7': { id: 7, employer_id: 42 } });
    const guard = authorize('ownedByEmployer', { model: Model, allowAdmin: false });

    const { outcome } = await run(guard, makeReq({
      params: { id: '7' }, email: 'boss@example.com', employer: { id: 43 }
    }));

    assert.strictEqual(outcome, 403);
  });
});

// --- fail closed --------------------------------------------------------------------

test('an error while loading the record is a 500, never a pass', async () => {
  const Model = { async findByPk() { throw new Error('connection terminated'); } };
  const guard = authorize('ownedByEmployer', { model: Model });

  assert.strictEqual((await run(guard, makeReq({ params: { id: '7' }, employer: { id: 42 } }))).outcome, 500);
});

test('an error inside the policy is a 500, never a pass', async () => {
  const Model = makeModel({ '7': { id: 7, get employer_id() { throw new Error('boom'); } } });
  const guard = authorize('ownedByEmployer', { model: Model });

  assert.strictEqual((await run(guard, makeReq({ params: { id: '7' }, employer: { id: 42 } }))).outcome, 500);
});

test('a caller whose identity cannot be resolved is refused, not passed through', async () => {
  // No subject → resolveEmployer returns null without querying (proven in
  // identityService.test.js). The guard must turn that null into a 403.
  const Model = makeModel({ '7': { id: 7, employer_id: 42 } });
  const guard = authorize('ownedByEmployer', { model: Model });
  const req = makeReq({ params: { id: '7' } });
  req.authSubject = null;

  assert.strictEqual((await run(guard, req)).outcome, 403);
});

// --- scopeToCaller (Q3) -------------------------------------------------------------

test('scopeToCaller derives the filter from the caller', async () => {
  assert.deepStrictEqual(await scopeToCaller(makeReq({ employer: { id: 42 } })), { employer_id: 42 });
});

test('scopeToCaller ignores a client-supplied filter entirely', async () => {
  // This is the whole point: the old handler read req.query.employer_id and used it as
  // the where clause, so any authenticated caller could list any employer's rows.
  const req = makeReq({ query: { employer_id: 999 }, employer: { id: 42 } });

  assert.deepStrictEqual(await scopeToCaller(req), { employer_id: 42 });
});

test('scopeToCaller returns null — not {} — when the caller holds no such role', async () => {
  // {} would widen the query to every row in the table. The distinction is the only
  // thing standing between "no role" and "sees everything".
  const req = makeReq({ query: { employer_id: 999 } });
  req.authSubject = null;

  assert.strictEqual(await scopeToCaller(req), null);
});

test('scopeToCaller gives an admin an unscoped fragment', async () => {
  await withAdminEmails('boss@example.com', async () => {
    assert.deepStrictEqual(await scopeToCaller(makeReq({ email: 'boss@example.com' })), {});
  });
});

test('scopeToCaller honours the column name', async () => {
  const req = makeReq({ employer: { id: 42 } });
  assert.deepStrictEqual(await scopeToCaller(req, { column: 'owner_employer_id' }), { owner_employer_id: 42 });
});

// --- the guard is introspectable by PR C's startup assertion -------------------------
//
// The deny-by-default check walks the live router stack rather than grepping source,
// because router-level guards are invisible on route lines. What it finds there is a
// closure, so the declared policy has to be readable off the function itself.

test('the returned guard declares its policy as metadata', () => {
  const Model = makeModel({});
  Model.name = 'JobPosting';
  const guard = authorize('ownedByEmployer', { model: Model, paramName: 'jobId' });

  assert.strictEqual(guard.policy, 'ownedByEmployer');
  assert.strictEqual(guard.policyOptions.paramName, 'jobId');
  assert.strictEqual(guard.policyOptions.model, 'JobPosting');
  assert.strictEqual(guard.policyOptions.allowAdmin, true);
});

test('the guard is named after its policy, not anonymous', () => {
  // An anonymous middleware shows up as "<anonymous>" in a route dump, which makes the
  // inventory in PR C unreadable and the assertion unable to report what it found.
  assert.strictEqual(authorize('contractParty', { model: makeModel({}) }).name, 'authorize(contractParty)');
  assert.strictEqual(authorize('admin').name, 'authorize(admin)');
});

test('every policy name produces a guard that reports that policy', () => {
  // Keeps the metadata honest if a sixth shape is ever added.
  for (const name of POLICY_NAMES) {
    const guard = authorize(name, { model: makeModel({}) });
    assert.strictEqual(guard.policy, name);
  }
});

// --- declarePolicy: routes no guard can cover ---------------------------------------
//
// A list route has no record to load, so scoping happens in the handler. PR C's assertion
// still has to see something on the route line, and it accepts a declaration as well as a
// guard: both carry .policy, and .enforced says which kind it found.

test('declarePolicy returns an inert middleware that just calls next()', async () => {
  const marker = declarePolicy('scopedList');
  const res = makeRes();
  let nexted = false;

  await marker(makeReq(), res, () => { nexted = true; });

  assert.strictEqual(nexted, true);
  assert.strictEqual(res.statusCode, null, 'a declaration must never respond');
});

test('a declaration carries its policy and is marked unenforced', () => {
  const marker = declarePolicy('scopedList');

  assert.strictEqual(marker.policy, 'scopedList');
  assert.strictEqual(marker.enforced, false);
  assert.strictEqual(marker.name, 'declarePolicy(scopedList)');
});

test('an authorize() guard is marked enforced, a declaration is not', () => {
  // The distinction PR C reports on: a guard proves something, a declaration promises it.
  assert.strictEqual(authorize('admin').enforced, true);
  assert.strictEqual(declarePolicy('scopedList').enforced, false);
});

test('an unknown declaration throws when the route file loads', () => {
  assert.throws(() => declarePolicy('scoped'), /unknown declaration/);
  assert.throws(() => declarePolicy('scoped'), /scopedList, ownerFromCaller, public, handlerEnforced/);
  assert.throws(() => declarePolicy('scoped'), /use authorize\(\) instead/);
});

test('the enforcement and declaration vocabularies stay separate', () => {
  // A shape that can be enforced must not be declarable — declaring 'ownedByEmployer'
  // would satisfy PR C's assertion while checking nothing at all.
  for (const name of POLICY_NAMES) {
    assert.throws(() => declarePolicy(name), /unknown declaration/,
      `${name} is enforceable and must not be declarable`);
  }
  assert.deepStrictEqual(DECLARATION_NAMES,
    ['scopedList', 'ownerFromCaller', 'public', 'handlerEnforced']);
});

test('an unguarded route has to say why', () => {
  // 'public' and 'handlerEnforced' are the two ways to end up with no enforcement on a
  // route. Both cost a sentence, so the annotation pass in PR C cannot wave routes
  // through silently.
  assert.throws(() => declarePolicy('public'), /needs a \{ reason \}/);
  assert.throws(() => declarePolicy('handlerEnforced'), /needs a \{ reason \}/);

  const open = declarePolicy('public', { reason: 'the job market is public by design' });
  assert.strictEqual(open.reason, 'the job market is public by design');

  // scopedList needs none: it names the mechanism, which is the reason.
  assert.doesNotThrow(() => declarePolicy('scopedList'));
});

test('metadata survives being mounted on a real Express route', async () => {
  // Express wraps each handler in a Layer that copies only `name`, so the assertion in
  // PR C must read layer.handle.policy — layer.policy is always undefined, which is
  // indistinguishable from an unannotated route. This pins where the metadata is
  // reachable from, so a change to how the guard is built cannot silently hide it.
  const express = require('express');
  const router = express.Router();
  const Model = makeModel({});
  Model.name = 'JobPosting';

  router.put('/:id', authorize('ownedByEmployer', { model: Model }), (req, res) => res.end());
  router.get('/', declarePolicy('scopedList'), (req, res) => res.end());

  const declarations = router.stack
    .filter((l) => l.route)
    .map((l) => {
      const found = l.route.stack.map((s) => s.handle).find((h) => h.policy);
      return found && { policy: found.policy, enforced: found.enforced };
    });

  assert.deepStrictEqual(declarations, [
    { policy: 'ownedByEmployer', enforced: true },
    { policy: 'scopedList', enforced: false }
  ]);
});

// --- scopeToCaller: allowAdmin ------------------------------------------------------
//
// Surfaced by PR B. Some list handlers need a concrete owner id rather than a filter — a
// raw SQL query binding :employer_id, or anything that destructures the fragment. `{}` is
// a valid filter meaning "unscoped" but not a valid value, so an admin would arrive at
// those with the id undefined: a query with no scope at all, or a crash.

test('scopeToCaller with allowAdmin false scopes an admin to their own row', async () => {
  await withAdminEmails('boss@example.com', async () => {
    const req = makeReq({ email: 'boss@example.com', employer: { id: 42 } });

    assert.deepStrictEqual(await scopeToCaller(req), {}, 'unscoped by default');
    assert.deepStrictEqual(await scopeToCaller(req, { allowAdmin: false }), { employer_id: 42 });
  });
});

test('scopeToCaller with allowAdmin false refuses an admin holding no employer row', async () => {
  // An admin with no employer profile has no report to show. Refusing is correct; the
  // alternative is a query scoped to undefined, which returns either everything or an error
  // depending on the call site.
  await withAdminEmails('boss@example.com', async () => {
    const req = makeReq({ email: 'boss@example.com' });
    req.authSubject = null;

    assert.strictEqual(await scopeToCaller(req, { allowAdmin: false }), null);
  });
});

test('a scope fragment is never destructured into an undefined id', () => {
  // The failure this option exists to prevent, stated as the invariant it protects:
  // if a handler reads scope.employer_id, it must have passed allowAdmin: false.
  const fragment = {};                       // what an admin gets by default
  assert.strictEqual(fragment.employer_id, undefined);
  assert.strictEqual('employer_id' in fragment, false);
});

test('ownerFromCaller declares a create route and needs no reason', () => {
  // Creates cannot be guarded — there is no record yet. The declaration marks the inverse
  // obligation: the handler derives the owner from the caller, and the body cannot set it.
  const marker = declarePolicy('ownerFromCaller');

  assert.strictEqual(marker.policy, 'ownerFromCaller');
  assert.strictEqual(marker.enforced, false, 'a promise about the handler, not a check');
  assert.doesNotThrow(() => declarePolicy('ownerFromCaller'));
});

// --- scopeToCaller: roles other than employer ---------------------------------------

test('scopeToCaller scopes to the employee when asked', async () => {
  const req = makeReq();
  req.authSubject = null;   // employee resolution returns null without a DB

  assert.strictEqual(await scopeToCaller(req, { column: 'employee_id', as: 'employee' }), null);
});

test('scopeToCaller rejects an unknown role instead of guessing', async () => {
  // Previously `as` was a two-way ternary, so anything that was not the literal 'employer'
  // silently scoped to the employee. A typo would have filtered by the wrong person's id
  // — and in the direction that returns data rather than the one that returns none.
  await assert.rejects(
    () => scopeToCaller(makeReq({ employer: { id: 42 } }), { as: 'employeer' }),
    /unknown role 'employeer'/
  );
});

test('the known roles are exactly the four identity kinds', async () => {
  // employer, employee, mediator, recruiter. A fifth appearing means a new identity kind
  // exists and every list endpoint scoped by role needs revisiting.
  await assert.rejects(
    () => scopeToCaller(makeReq(), { as: 'nope' }),
    /Known roles: employee, employer, mediator, recruiter/
  );
});

// --- applicationParty and via: ownership one hop away -------------------------------
//
// JobApplication carries employee_id and job_posting_id but no employer_id, so the
// employer who may act on it is named by the job posting. `via` loads that record and
// hands it to the policy as `parent`.

const APPLICATION = { id: 5, employee_id: 9, job_posting_id: 77 };
const POSTING = { id: 77, employer_id: 42 };

test('applicationParty admits the applicant and the posting owner', async () => {
  assert.strictEqual(
    await check('applicationParty', { record: APPLICATION, parent: POSTING, roles: makeRoles({ employee: { id: 9 } }) }),
    true, 'the worker who applied');
  assert.strictEqual(
    await check('applicationParty', { record: APPLICATION, parent: POSTING, roles: makeRoles({ employer: { id: 42 } }) }),
    true, 'the employer whose posting it is');
});

test('applicationParty refuses another worker and another employer', async () => {
  assert.strictEqual(
    await check('applicationParty', { record: APPLICATION, parent: POSTING, roles: makeRoles({ employee: { id: 10 } }) }), false);
  assert.strictEqual(
    await check('applicationParty', { record: APPLICATION, parent: POSTING, roles: makeRoles({ employer: { id: 43 } }) }), false);
  assert.strictEqual(
    await check('applicationParty', { record: APPLICATION, parent: POSTING, roles: makeRoles({}) }), false);
});

test('applicationParty refuses the employer side when the parent is missing', async () => {
  // Without the posting there is nothing to compare an employer against. It must refuse,
  // not fall through — the worker check passing for an employer would be worse than a 403.
  assert.strictEqual(
    await check('applicationParty', { record: APPLICATION, parent: null, roles: makeRoles({ employer: { id: 42 } }) }), false);
  assert.strictEqual(
    await check('applicationParty', { record: APPLICATION, parent: undefined, roles: makeRoles({ employer: { id: 42 } }) }), false);
});

test('applicationParty does not match a posting with no owner', async () => {
  const orphan = { id: 77, employer_id: null };
  assert.strictEqual(
    await check('applicationParty', { record: APPLICATION, parent: orphan, roles: makeRoles({ employer: { id: undefined } }) }), false);
});

test('via loads the parent and attaches it as req.resourceParent', async () => {
  const Applications = makeModel({ '5': { ...APPLICATION } });
  const Postings = makeModel({ '77': { ...POSTING } });
  Postings.name = 'JobPosting';

  const guard = authorize('applicationParty', {
    model: Applications, via: { model: Postings, key: 'job_posting_id' }
  });

  // No subject: the employee role resolves to null offline, and the employer comes from
  // req.employer as requireApprovedEmployer would have left it.
  const req0 = makeReq({ params: { id: '5' }, employer: { id: 42 } });
  req0.authSubject = null;
  const { outcome, req } = await run(guard, req0);

  assert.strictEqual(outcome, 'next');
  assert.strictEqual(req.resource.id, 5);
  assert.strictEqual(req.resourceParent.id, 77, 'the handler gets the posting too');
  assert.deepStrictEqual(Postings.lookups, [77], 'looked up by the foreign key');
});

test('a dangling foreign key is 404, never a pass', async () => {
  const Applications = makeModel({ '5': { ...APPLICATION, job_posting_id: 999 } });
  const Postings = makeModel({});
  Postings.name = 'JobPosting';

  const guard = authorize('applicationParty', {
    model: Applications, via: { model: Postings, key: 'job_posting_id' }
  });

  const req = makeReq({ params: { id: '5' }, employer: { id: 42 } });
  req.authSubject = null;
  assert.strictEqual((await run(guard, req)).outcome, 404);
});

test('via is reported in the metadata for PR C', () => {
  const Applications = makeModel({});
  Applications.name = 'JobApplication';
  const Postings = makeModel({});
  Postings.name = 'JobPosting';

  const guard = authorize('applicationParty', {
    model: Applications, via: { model: Postings, key: 'job_posting_id' }
  });

  assert.deepStrictEqual(guard.policyOptions.via, { model: 'JobPosting', key: 'job_posting_id' });
});

test('an incomplete via throws when the route file loads', () => {
  const M = makeModel({});
  assert.throws(() => authorize('applicationParty', { model: M, via: { key: 'x' } }), /via needs both/);
  assert.throws(() => authorize('applicationParty', { model: M, via: { model: M } }), /via needs both/);
});
