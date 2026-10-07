// -----------------------------------------------------------------------------
// What a job posting looks like to someone who does not own it.
//
// A posting is public — a job market nobody can browse is not a job market — but
// the row behind it is not. recruiter_id, recruiter_fee_amount and
// recruiter_fee_currency record what the employer agreed to pay which recruiter,
// and were returned in full to anonymous visitors and to any worker who saved or
// applied to the job (#164).
//
// An allowlist, for the same reason as utils/fields.js: a column added next year
// stays private until someone decides it belongs in the advert. A denylist would
// publish it by default.
//
// The worker still needs to know *whether* a recruiter is involved — the offer
// screen asks them to confirm they owe no recruiter fee — so that survives as a
// boolean. Who the recruiter is and what they are paid does not.
// -----------------------------------------------------------------------------

const PUBLIC_POSTING_FIELDS = [
  'id', 'employer_id', 'template_id', 'title', 'status',
  'positions_available', 'positions_filled', 'application_deadline',
  'job_type', 'location_type', 'location',
  'salary', 'currency', 'pay_frequency', 'additional_compensation', 'employee_benefits',
  'selected_oracles', 'responsibilities', 'skills', 'description',
  'company_name', 'company_description',
  'application_count', 'accepted_count',
  'created_at', 'updated_at'
];

/**
 * Projects a job posting (model instance or plain row) to its public shape.
 * Returns null for a missing posting, so it is safe on an optional include.
 */
const toPublicPosting = (posting) => {
  if (!posting) return null;
  const row = typeof posting.toJSON === 'function' ? posting.toJSON() : posting;
  const out = {};
  for (const field of PUBLIC_POSTING_FIELDS) {
    if (field in row) out[field] = row[field];
  }
  out.has_recruiter = row.recruiter_id != null;
  return out;
};

/**
 * The same projection as a SQL select list, for raw queries over `job_postings`.
 * The field names are the constants above, never input, so interpolation is safe.
 */
const publicPostingColumns = (alias) => [
  ...PUBLIC_POSTING_FIELDS.map((field) => `${alias}.${field}`),
  `(${alias}.recruiter_id IS NOT NULL) AS has_recruiter`
].join(', ');

module.exports = { PUBLIC_POSTING_FIELDS, toPublicPosting, publicPostingColumns };
