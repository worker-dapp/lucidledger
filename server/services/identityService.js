// -----------------------------------------------------------------------------
// Identity resolution
//
// The canonical authorization primitive: resolve the calling user's DB record from
// their verified auth subject (the JWT `sub` claim, exposed as req.authSubject by
// verifyToken). Authorization decisions key off this cryptographically-proven
// identity and nothing else.
//
// There is deliberately no fallback. `auth_subject` is NOT NULL on employee and
// employer (migration 033), and it is written at record creation from the verified
// token, so every row is bound to an identity the moment it exists. A request whose
// subject matches no row is simply not that user — there is no secondary identifier
// worth consulting, and consulting one would reintroduce exactly the weakness this
// replaced: the client-supplied x-wallet-address header was previously trusted to
// name the caller, which let any authenticated user act as anyone else.
//
// Nothing here depends on wallets or on a blockchain, so this applies unchanged to
// any JWT-based auth provider.
// -----------------------------------------------------------------------------

const resolveRecord = async (Model, { authSubject }, options = {}) => {
  if (!authSubject) return null;
  // `options` carries an open transaction when the caller has one. Without it the lookup
  // takes a separate pool connection while the transaction holds another, which deadlocks
  // under concurrency against a small pool.
  return Model.findOne({ where: { auth_subject: authSubject }, ...options });
};

// Resolve the calling user's Employee record from the verified subject.
// Pass { transaction } when called inside an open transaction.
const resolveEmployee = (req, options = {}) => {
  // Checked before requiring the model layer: an unauthenticated request should cost
  // neither a query nor a connection.
  if (!req.authSubject) return Promise.resolve(null);
  const { Employee } = require('../models');
  return resolveRecord(Employee, { authSubject: req.authSubject }, options);
};

// Resolve the calling user's Employer record from the verified subject.
// Pass { transaction } when called inside an open transaction.
const resolveEmployer = (req, options = {}) => {
  if (!req.authSubject) return Promise.resolve(null);
  const { Employer } = require('../models');
  return resolveRecord(Employer, { authSubject: req.authSubject }, options);
};

// Resolve the calling Mediator record from the verified identity.
//
// Mediators have no auth_subject column: an admin creates the row before the person
// first logs in, so there is no verified subject to bind at creation time. They are
// therefore matched on the Privy-verified email (req.user.email, set by verifyToken
// from a server-side lookup keyed by the JWT sub) — still server-derived, never
// client-supplied. #143 tracks binding these to auth_subject on first login.
//
// Case-insensitive EQUALITY, not iLike. Under iLike the caller's own email becomes a
// LIKE *pattern*, and `_` — a legal, common local-part character — matches any single
// character. A verified `j_ne.doe@x.com` would resolve as the mediator `jane.doe@x.com`.
const resolveMediator = async (req) => {
  const email = req.user?.email;
  if (!email) return null;
  const { Mediator, sequelize } = require('../models');
  return Mediator.findOne({
    where: sequelize.and(
      sequelize.where(sequelize.fn('lower', sequelize.col('email')), email.toLowerCase()),
      { status: 'active' }
    )
  });
};

// Resolve the calling Recruiter record from the verified identity.
//
// Like mediators, recruiters have no auth_subject column — an employer or admin creates
// the row before the person first logs in — so they are matched on the Privy-verified
// email. #143 tracks binding both to auth_subject on first login.
//
// Same rule as resolveMediator: case-insensitive EQUALITY via lower(), never iLike. Under
// iLike the caller's own email becomes a LIKE pattern and `_` matches any character.
// Note this also fixes an assumption in the previous inline lookup, which compared against
// a lowercased input but an un-lowercased column, so a recruiter row stored with any
// capitalisation would silently fail to resolve.
const resolveRecruiter = async (req) => {
  const email = req.user?.email;
  if (!email) return null;
  const { Recruiter, sequelize } = require('../models');
  return Recruiter.findOne({
    where: sequelize.and(
      sequelize.where(sequelize.fn('lower', sequelize.col('email')), email.toLowerCase()),
      { status: 'active' }
    )
  });
};

// Admin check keyed off the verified identity, using the email-based admin model
// (ADMIN_EMAILS). req.user.email is populated by verifyToken from a server-side Privy
// lookup keyed by the verified DID, so it reflects the authenticated user and is not
// client-supplied. ADMIN_EMAILS is server config, so the admin set cannot be granted
// through the application or the database.
const isAdminRequest = (req) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = req.user?.email?.toLowerCase();
  return !!email && adminEmails.includes(email);
};

module.exports = {
  resolveEmployee, resolveEmployer, resolveMediator, resolveRecruiter,
  isAdminRequest, resolveRecord
};
