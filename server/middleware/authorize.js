// -----------------------------------------------------------------------------
// Authorization layer (#153)
//
// Answers the second and third of the three questions that "permissions" bundles
// (see notes/authorization-primer-and-route-inventory.md §1.2):
//
//   Q1  Who are you?                          → verifyToken, sets req.authSubject
//   Q2  May you act on THIS record?           → authorize()      (this file)
//   Q3  Which records may you see in a LIST?  → scopeToCaller()  (this file)
//
// Q2 and Q3 need genuinely different mechanisms, and conflating them is where a naive
// design fails: a list endpoint has no single record to check the caller against, so
// record checking cannot help it. authorize() loads a record and tests ownership;
// scopeToCaller() derives a where-fragment and discards whatever filter the client sent.
//
// The property that matters more than any individual check: **there is no way in this
// vocabulary to express "compare against a client-supplied id"**. The recurring bug in
// this codebase reads like a check but consults nothing the caller cannot control —
//
//     if (req.body.employer_id && record.employer_id !== req.body.employer_id) → 403
//
// Omit the field and no check runs; send the correct value (readable from a public GET)
// and it passes. That pattern is not merely discouraged here, it is unrepresentable.
//
// Structure: all identity I/O happens in callerRoles(); the policies themselves are pure
// comparisons over an already-resolved caller. That split is deliberate — a predicate that
// does its own lookups can only be tested against a live database, and these predicates
// are the part most worth testing.
// -----------------------------------------------------------------------------

const {
  resolveEmployee,
  resolveEmployer,
  resolveMediator,
  resolveRecruiter,
  isAdminRequest
} = require('../services/identityService');

/**
 * The caller's roles, resolved lazily and at most once each.
 *
 * This is the only place the layer decides who the caller is, and it consults exactly two
 * server-derived inputs: req.authSubject (the verified JWT sub) and req.user.email (a
 * server-side Privy lookup keyed by that sub). No header, body field, or query parameter
 * is identity.
 *
 * Each accessor returns a promise for the record or null. Memoized because contractParty
 * asks for three roles and would otherwise issue the same query on every retry path.
 */
const callerRoles = (req) => {
  const cache = {};
  return {
    employee: () => (cache.employee ??= resolveEmployee(req)),
    // requireApprovedEmployer may already have resolved this from the same verified
    // subject; reuse saves a query on the common employer path.
    employer: () => (cache.employer ??= (req.employer
      ? Promise.resolve(req.employer)
      : resolveEmployer(req))),
    mediator: () => (cache.mediator ??= resolveMediator(req)),
    recruiter: () => (cache.recruiter ??= resolveRecruiter(req))
  };
};

// Every authorization decision in this codebase is one of five shapes. Derived from the
// real endpoints, not invented — the count has held at five against repeated recounts,
// including against endpoints the original survey had never looked at.
//
// Each check is a predicate over { req, record, roles, paramName, as } returning a
// boolean. It returns false — never throws — when the caller simply holds no such role.
const POLICIES = {
  // The caller's own employee/employer row. Used by profile reads and updates.
  self: {
    requiresRecord: false,
    async check({ req, roles, paramName, as }) {
      const caller = as === 'employer' ? await roles.employer() : await roles.employee();
      return !!caller && String(caller.id) === String(req.params[paramName]);
    }
  },

  // The record belongs to the calling employer. Job postings, contract templates,
  // kiosks, NFC badges.
  ownedByEmployer: {
    requiresRecord: true,
    async check({ record, roles }) {
      const caller = await roles.employer();
      return !!caller && String(record.employer_id) === String(caller.id);
    }
  },

  // The caller is a party to the contract: its employer, its worker, or the mediator
  // actually assigned to it. Note "assigned" — holding the mediator role is not enough,
  // or any active mediator could act on any contract in the system.
  contractParty: {
    requiresRecord: true,
    async check({ record, roles }) {
      const [employer, employee, mediator] = await Promise.all([
        roles.employer(), roles.employee(), roles.mediator()
      ]);
      if (employer && String(record.employer_id) === String(employer.id)) return true;
      if (employee && String(record.employee_id) === String(employee.id)) return true;
      // mediator_id is null on an unassigned contract. Requiring it to be set before
      // comparing keeps an unassigned contract from admitting every mediator: without
      // the null guard a record and a caller that both stringify to "null"/"undefined"
      // could match.
      if (mediator && record.mediator_id != null
          && String(record.mediator_id) === String(mediator.id)) return true;
      return false;
    }
  },

  // A party to a job application: the worker who applied, or the employer whose posting it
  // is. The employer side is one hop away — JobApplication carries employee_id and
  // job_posting_id but no employer_id — so this policy reads the owner off `parent`, the
  // record named by the route's `via` option.
  //
  // The sixth shape. The survey found five and the count held against every recount, but
  // every endpoint it examined owned its records directly. Applications are the first
  // record type whose owner is reached through another record, and both sides of the
  // relationship act on it: the employer accepts or rejects, the worker signs or declines.
  applicationParty: {
    requiresRecord: true,
    async check({ record, parent, roles }) {
      const [employee, employer] = await Promise.all([roles.employee(), roles.employer()]);
      if (employee && String(record.employee_id) === String(employee.id)) return true;

      // parent is the JobPosting. Absent it there is no employer to compare against, and
      // guessing is not an option — refuse rather than fall through to the worker check.
      const owner = parent?.employer_id;
      if (employer && owner != null && String(owner) === String(employer.id)) return true;
      return false;
    }
  },

  // Verified email in ADMIN_EMAILS. Server config, so admin cannot be granted through
  // the application or by writing to the database.
  admin: {
    requiresRecord: false,
    async check({ req }) {
      return isAdminRequest(req);
    }
  },

  // A registered device, not a user at all. kioskAuth has already hashed the device
  // token and looked up the row; this only asserts it succeeded.
  kiosk: {
    requiresRecord: false,
    async check({ req }) {
      return !!req.kioskDevice;
    }
  }
};

const POLICY_NAMES = Object.keys(POLICIES);

/**
 * Route guard for record endpoints.
 *
 *   router.put('/:id', verifyToken, authorize('ownedByEmployer', { model: JobPosting }),
 *     JobPostingController.updateJobPosting);
 *
 * Loads the record named by the path parameter, evaluates the policy against the
 * verified caller, and attaches the record as `req.resource` so the handler does not
 * refetch it or re-derive ownership.
 *
 * Misconfiguration throws at require time — when the route file loads, i.e. at server
 * startup — rather than failing on a request. An unknown policy name or a record-shaped
 * policy with no model is a boot error, in the same spirit as verifyCriticalInvariants().
 *
 * @param {string} policy   One of: self, ownedByEmployer, contractParty, admin, kiosk.
 * @param {object} [opts]
 * @param {object} [opts.model]        Sequelize model to load the record from.
 * @param {string} [opts.paramName]    Path param holding the id. Default 'id'.
 * @param {boolean} [opts.allowAdmin]  Admins bypass the policy. Default true.
 * @param {string} [opts.as]           For 'self': 'employee' (default) or 'employer'.
 * @param {object} [opts.via]          `{ model, key }` — load a related record and hand it
 *                                     to the policy as `parent`. For record types whose
 *                                     owner lives one hop away: a job application's
 *                                     employer is on its job posting, not on itself.
 */
const authorize = (policy, { model = null, paramName = 'id', allowAdmin = true, as = 'employee', via = null } = {}) => {
  const entry = POLICIES[policy];
  if (!entry) {
    throw new Error(
      `authorize(): unknown policy '${policy}'. Known policies: ${POLICY_NAMES.join(', ')}.`
    );
  }
  if (entry.requiresRecord && !model) {
    throw new Error(
      `authorize('${policy}') needs a { model } to load the record it checks ownership of.`
    );
  }
  if (via && (!via.model || !via.key)) {
    throw new Error(`authorize('${policy}'): via needs both { model, key }.`);
  }

  const guard = async (req, res, next) => {
    try {
      let record = null;

      // The record loads BEFORE the admin bypass, so req.resource is populated for every
      // caller that gets through — including admins. Short-circuiting first would hand
      // admins a request whose handler finds req.resource undefined.
      if (model) {
        record = await model.findByPk(req.params[paramName]);
        if (!record) {
          return res.status(404).json({ success: false, message: 'Not found' });
        }
        req.resource = record;
      }

      // The related record carrying the owner, when ownership is one hop away. Loaded
      // before the admin bypass for the same reason the record is: a handler that reads
      // req.resourceParent must find it there for every caller who gets through.
      let parent = null;
      if (via && record) {
        parent = await via.model.findByPk(record[via.key]);
        if (!parent) {
          // A dangling foreign key. Not the caller's doing, but ownership cannot be
          // established, so the request cannot be allowed.
          console.error(`authorize('${policy}'): ${via.key}=${record[via.key]} matched no ${via.model.name}`);
          return res.status(404).json({ success: false, message: 'Not found' });
        }
        req.resourceParent = parent;
      }

      if (allowAdmin && isAdminRequest(req)) return next();

      const ok = await entry.check({ req, record, parent, roles: callerRoles(req), paramName, as });
      if (!ok) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      next();
    } catch (error) {
      // Fail closed. An error resolving identity is not permission to proceed.
      console.error(`authorize('${policy}') error:`, error.message);
      res.status(500).json({ success: false, message: 'Authorization error' });
    }
  };

  // PR C's deny-by-default assertion walks the live router stack — it cannot grep source,
  // because a router-level `router.use(verifyToken)` is invisible on the route lines (see
  // notes/authorization-primer-and-route-inventory.md §2.2). A stack walk sees only an
  // anonymous closure, so the declared policy is attached as metadata for it to read, and
  // the function is named so stack traces and route dumps stay legible.
  Object.defineProperty(guard, 'name', { value: `authorize(${policy})`, configurable: true });
  guard.policy = policy;
  guard.enforced = true;
  guard.policyOptions = {
    paramName, allowAdmin, as,
    model: model?.name ?? null,
    via: via ? { model: via.model?.name ?? null, key: via.key } : null
  };

  return guard;
};

// Declarations for routes that no guard can cover. PR C's assertion accepts a route whose
// stack carries a .policy from either source; .enforced distinguishes them.
//
// Where to read it: Express wraps each handler in a Layer, and a Layer copies only the
// function's `name` — not its other properties. So the walk is
//
//     route.stack.map((layer) => layer.handle.policy)     // not layer.policy
//
// layer.policy is always undefined, which looks exactly like an unannotated route. Cost an
// hour once; noted so PR C does not pay it again.
const DECLARATIONS = {
  // The handler calls scopeToCaller() and discards client filters. A list route cannot be
  // guarded: there is no record to load, and the scoping has to happen where the query is
  // built. So the route line declares it and the handler performs it.
  scopedList: { needsReason: false },

  // A create route. The record does not exist yet, so there is nothing to load and check;
  // what matters is the inverse — the handler derives the owning id from the verified
  // caller and ignores any owner field in the body. Same derivation as scopeToCaller, used
  // as an assignment rather than a filter.
  //
  // Its own declaration rather than a handlerEnforced reason written out seven times: it is
  // a recurring, checkable pattern, and a reviewer seeing it knows exactly what to look for
  // in the handler — an owner id that comes from the caller and a body that cannot override
  // it.
  ownerFromCaller: { needsReason: false },

  // Deliberately open. GET /api/job-postings/active is the real case: the job market is
  // public by design.
  public: { needsReason: true },

  // Authorization genuinely lives in the handler because it depends on something only the
  // handler knows. An escape hatch that has to argue for itself — if this becomes common,
  // the vocabulary is missing a shape.
  handlerEnforced: { needsReason: true }
};

const DECLARATION_NAMES = Object.keys(DECLARATIONS);

/**
 * Inert route marker: declares how a route is authorized when no guard can express it.
 *
 *   router.get('/', verifyToken, declarePolicy('scopedList'),
 *     ContractTemplateController.getTemplatesByEmployer);
 *
 * Calls next() and nothing else. Its only purpose is to be visible to the startup
 * assertion in PR C, which walks the live router stack — it cannot grep source, because a
 * router-level `router.use(verifyToken)` is invisible on the route lines.
 *
 * This is a promise the route makes about its handler, and unlike authorize() nothing
 * enforces it. That is the cost of the two mechanisms being different: scoping has to
 * happen where the query is built. A 'scopedList' declaration means a reviewer should
 * check the handler calls scopeToCaller() and merges no client filter.
 *
 * @param {string} declaration  One of: scopedList, public, handlerEnforced.
 * @param {object} [opts]
 * @param {string} [opts.reason]  Required for 'public' and 'handlerEnforced'.
 */
const declarePolicy = (declaration, { reason = null } = {}) => {
  const entry = DECLARATIONS[declaration];
  if (!entry) {
    throw new Error(
      `declarePolicy(): unknown declaration '${declaration}'. `
      + `Known declarations: ${DECLARATION_NAMES.join(', ')}. `
      + `For an enforceable policy use authorize() instead.`
    );
  }
  if (entry.needsReason && !reason) {
    throw new Error(
      `declarePolicy('${declaration}') needs a { reason } — an unguarded route has to say why.`
    );
  }

  const marker = (req, res, next) => next();
  Object.defineProperty(marker, 'name', { value: `declarePolicy(${declaration})`, configurable: true });
  marker.policy = declaration;
  marker.enforced = false;
  marker.reason = reason;

  return marker;
};

/**
 * Query scope for list endpoints — Q3.
 *
 *   const scope = await scopeToCaller(req);
 *   if (!scope) return res.status(403).json({ success: false, message: 'Forbidden' });
 *   const rows = await ContractTemplate.findAll({ where: { ...scope } });
 *
 * Returns a where-fragment naming the caller, `{}` for an admin (who sees everything),
 * or **null** when the caller holds no such role — which the handler must treat as 403.
 * Returning null rather than `{}` for the no-role case is deliberate: an empty fragment
 * would silently widen the query to every row in the table.
 *
 * Whatever filter the client sent is not consulted. req.query.employer_id is not an
 * input to this function and must not be merged into the where clause afterwards.
 *
 * `allowAdmin: false` scopes an admin to their own row like anyone else. Use it where the
 * handler needs a concrete owner id rather than a filter — a raw SQL query with a bound
 * `:employer_id`, or anything that destructures the fragment. Those cannot express "all
 * rows", and an admin would otherwise reach them with the id undefined: `{}` is a valid
 * *filter* meaning unscoped, and not a valid *value*.
 *
 * @param {object} req
 * @param {object} [opts]
 * @param {string} [opts.column]       Column naming the owner. Default 'employer_id'.
 * @param {string} [opts.as]           Role to resolve: 'employer' (default) or 'employee'.
 * @param {boolean} [opts.allowAdmin]  Admin gets the unscoped `{}`. Default true.
 * @returns {Promise<object|null>}
 */
const scopeToCaller = async (req, { column = 'employer_id', as = 'employer', allowAdmin = true } = {}) => {
  if (allowAdmin && isAdminRequest(req)) return {};

  const roles = callerRoles(req);
  const resolve = roles[as];
  if (!resolve) {
    // A typo'd role would otherwise fall through to a default and scope the query to the
    // wrong person's id — silently, and in the direction that shows data.
    throw new Error(`scopeToCaller(): unknown role '${as}'. Known roles: ${Object.keys(roles).join(', ')}.`);
  }

  const caller = await resolve();
  if (!caller) return null;
  return { [column]: caller.id };
};

// POLICIES is exported for its tests: the predicates are pure over a resolved caller, so
// they can be exercised directly without a database. Routes use authorize(), not this.
module.exports = {
  authorize, scopeToCaller, declarePolicy,
  POLICIES, POLICY_NAMES, DECLARATION_NAMES
};
