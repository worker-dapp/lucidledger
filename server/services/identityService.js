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

const resolveRecord = async (Model, { authSubject }) => {
  if (!authSubject) return null;
  return Model.findOne({ where: { auth_subject: authSubject } });
};

// Resolve the calling user's Employee record from the verified subject.
const resolveEmployee = (req) => {
  const { Employee } = require('../models');
  return resolveRecord(Employee, { authSubject: req.authSubject });
};

// Resolve the calling user's Employer record from the verified subject.
const resolveEmployer = (req) => {
  const { Employer } = require('../models');
  return resolveRecord(Employer, { authSubject: req.authSubject });
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

module.exports = { resolveEmployee, resolveEmployer, isAdminRequest, resolveRecord };
