const { test } = require('node:test');
const assert = require('node:assert');
const { pickAllowedFields } = require('./fields');

test('keeps allowed fields and drops everything else', () => {
  const out = pickAllowedFields({ name: 'a', employer_id: 99, id: 1 }, ['name']);
  assert.deepStrictEqual(out, { name: 'a' });
});

test('an ownership field is dropped even when it names the real owner', () => {
  // The whole point: the caller may know the right value and still not be allowed to set it.
  const out = pickAllowedFields({ title: 'x', employer_id: 42 }, ['title']);
  assert.strictEqual('employer_id' in out, false);
});

test('absent fields stay absent, so partial updates stay partial', () => {
  // If this invented keys with undefined values, a PATCH of one field would null the rest.
  const out = pickAllowedFields({ name: 'a' }, ['name', 'description', 'base_salary']);
  assert.deepStrictEqual(out, { name: 'a' });
  assert.strictEqual('description' in out, false);
});

test('falsy-but-real values survive', () => {
  // 0, '' and false are legitimate values; a truthiness filter would silently drop them.
  const out = pickAllowedFields({ base_salary: 0, notes: '', active: false }, ['base_salary', 'notes', 'active']);
  assert.deepStrictEqual(out, { base_salary: 0, notes: '', active: false });
});

test('a null or non-object payload yields an empty object, not a crash', () => {
  assert.deepStrictEqual(pickAllowedFields(null, ['a']), {});
  assert.deepStrictEqual(pickAllowedFields(undefined, ['a']), {});
  assert.deepStrictEqual(pickAllowedFields('nope', ['a']), {});
});

test('an empty allowlist writes nothing', () => {
  assert.deepStrictEqual(pickAllowedFields({ a: 1, b: 2 }, []), {});
});

test('inherited properties are not picked up', () => {
  const payload = Object.create({ employer_id: 99 });
  payload.name = 'a';
  assert.deepStrictEqual(pickAllowedFields(payload, ['name', 'employer_id']), { name: 'a' });
});
