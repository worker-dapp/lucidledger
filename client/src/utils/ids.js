// -----------------------------------------------------------------------------
// Record id comparison.
//
// Every primary key in this schema is a Postgres BIGINT, and node-postgres returns
// bigints as **strings** — a bigint can exceed Number.MAX_SAFE_INTEGER, so parsing
// one into a JS number is lossy in a way that cannot be detected after the fact.
// So an id from the API is "2", not 2.
//
// Ids reaching the client from anywhere else carry their own types: DOM values are
// always strings, URL search params are always strings, and anything that has been
// through parseInt() is a number. Comparing the two sides with === is therefore
// wrong by default, and wrong in a quiet way:
//
//     templates.find((t) => t.id === parseInt(value))   // "2" === 2 → undefined
//
// That returned undefined rather than throwing, which in a controlled <select>
// rendered as a dropdown that silently refused to hold a selection (#158).
//
// Compare ids with this. Do not "fix" a mismatch by coercing the id to a number —
// that trades a visible bug for silent precision loss on large ids.
// -----------------------------------------------------------------------------

/**
 * True when two record ids refer to the same row, regardless of which side arrived
 * as a string and which as a number.
 *
 * Null and undefined never match anything, including each other: an absent id is
 * not an identity, and treating two absences as equal is how an unassigned record
 * comes to match an unset field.
 *
 * @param {string|number|null|undefined} a
 * @param {string|number|null|undefined} b
 * @returns {boolean}
 */
export const sameId = (a, b) => {
  if (a == null || b == null) return false;
  return String(a) === String(b);
};
