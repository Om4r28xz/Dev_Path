import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(
  await readFile(new URL('../technologies.json', import.meta.url), 'utf8'),
);
const corpus = JSON.parse(
  await readFile(new URL('../fixtures/extraction-corpus.json', import.meta.url), 'utf8'),
);
assert.equal(corpus.schemaVersion, '1.0.0');
assert.equal(corpus.catalogVersion, catalog.version);
assert.ok(Array.isArray(corpus.cases) && corpus.cases.length >= 20);
const known = new Set(catalog.technologies.map((entry) => entry.id));
const ids = new Set();
const texts = new Set();
const languages = new Set();
const tags = new Set();
const covered = new Set();
for (const entry of corpus.cases) {
  assert.deepEqual(Object.keys(entry).sort(), [
    'id',
    'jobText',
    'language',
    'rationale',
    'requiredSkillIds',
    'tags',
  ]);
  assert.match(entry.id, /^CAT-02-\d{3}$/);
  assert.ok(!ids.has(entry.id), `Duplicate case: ${entry.id}`);
  ids.add(entry.id);
  assert.ok(['es', 'en'].includes(entry.language));
  languages.add(entry.language);
  assert.equal(typeof entry.jobText, 'string');
  assert.ok(entry.jobText.length <= 20000);
  assert.ok(!texts.has(entry.jobText), `Duplicate text: ${entry.id}`);
  texts.add(entry.jobText);
  assert.ok(typeof entry.rationale === 'string' && entry.rationale.trim().length >= 10);
  assert.ok(Array.isArray(entry.requiredSkillIds));
  assert.deepEqual(entry.requiredSkillIds, [...new Set(entry.requiredSkillIds)].sort());
  for (const id of entry.requiredSkillIds) {
    assert.ok(known.has(id), `Unknown technology ${id} in ${entry.id}`);
    covered.add(id);
  }
  assert.ok(Array.isArray(entry.tags) && entry.tags.length > 0);
  for (const tag of entry.tags) {
    assert.ok(typeof tag === 'string' && tag.length > 0);
    tags.add(tag);
  }
  if (!entry.jobText.trim()) {
    assert.deepEqual(entry.requiredSkillIds, []);
    assert.ok(entry.tags.includes('empty'));
  }
}
assert.equal(languages.size, 2);
for (const tag of [
  'alias',
  'punctuation',
  'similar',
  'repetition',
  'negation',
  'empty',
  'no-technologies',
  'boundaries',
  'unknown',
  'case',
]) {
  assert.ok(tags.has(tag), `Missing coverage: ${tag}`);
}
assert.equal(covered.size, known.size, 'All catalog technologies must have positive coverage');
console.log(`Validated ${corpus.cases.length} synthetic ES/EN cases; catalog ${catalog.version}.`);
