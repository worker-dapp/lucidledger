// -----------------------------------------------------------------------------
// Payload field selection.
//
// Sequelize's create() and update() write every key they are handed, so passing
// req.body straight through lets a caller write any column the model declares —
// including the ones that decide who owns the row. Nothing about that is visible
// at the call site: `model.update(req.body)` looks like an ordinary update.
//
// Use an allowlist, never a denylist. Dropping the field you thought of protects
// against today's payload; naming the fields that may be written protects against
// the column somebody adds next year, which is the one nobody will remember to
// exclude. A denylist fails open as the schema grows.
//
// This was duplicated identically in four controllers before it was hoisted here
// (#153 PR B, closing the mass-assignment half of #96).
// -----------------------------------------------------------------------------

/**
 * Returns a copy of `payload` containing only the keys named in `allowedFields`.
 * Keys absent from the payload stay absent — this never invents a field, so it is
 * safe for partial updates.
 *
 * @param {object} payload        Untrusted input, typically req.body.
 * @param {string[]} allowedFields  Exactly the fields this endpoint may write.
 * @returns {object}
 */
const pickAllowedFields = (payload, allowedFields) => {
  if (!payload || typeof payload !== 'object') return {};
  return Object.keys(payload).reduce((acc, key) => {
    if (allowedFields.includes(key)) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

module.exports = { pickAllowedFields };
