// Structural consistency only; this does not approve human acceptance or rerun tests.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const base = 'docs/acceptance';
const matrix = readFileSync(base + '/M1-cases.md', 'utf8');
const expected = [
  ...matrix.matchAll(/^## ([A-Z]+-[\dA-Z]+)$/gm),
  ...matrix.matchAll(/^\|\s*(EVID-\d+)\s*\|/gm),
].map((match) => match[1]);
const cases = JSON.parse(readFileSync(base + '/evidence/cases.json', 'utf8'));
const execution = JSON.parse(readFileSync(base + '/evidence/execution.json', 'utf8'));
assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
assert.deepEqual(cases.map((c) => c.id).sort(), expected.sort());
for (const item of cases) {
  for (const field of [
    'id',
    'feature',
    'pre',
    'steps',
    'expected',
    'observed',
    'state',
    'evidence',
    'environment',
    'notes',
  ])
    assert.equal(typeof item[field], 'string', `${item.id}.${field}`);
  assert(['aprobado', 'fallido', 'no ejecutado'].includes(item.state));
  assert(/^[a-f0-9]{40}$/.test(item.commit));
  assert.equal(item.productCommit, execution.productCommit);
  assert(execution.environment[item.environment]);
  for (const file of item.evidence.split(';').map((p) => p.trim()))
    assert(existsSync(file) || existsSync(resolve(base, file)), `Missing evidence ${file}`);
}
for (const [state, field] of [
  ['aprobado', 'casesApproved'],
  ['fallido', 'casesFailed'],
  ['no ejecutado', 'casesNotExecuted'],
])
  assert.equal(cases.filter((c) => c.state === state).length, execution.counts[field]);
for (const entry of execution.files)
  assert.equal(
    createHash('sha256').update(readFileSync(entry.file)).digest('hex'),
    entry.sha256,
    `Evidence changed: ${entry.file}`,
  );
for (const name of ['M1-results.md', 'P5-review.md', 'REL-01-checklist.md']) {
  const content = readFileSync(base + '/' + name, 'utf8');
  assert(!/^(<<<<<<<|=======|>>>>>>>)/m.test(content));
  for (const link of content.matchAll(/\]\(([^)]+)\)/g))
    if (!/^(https?:|#)/.test(link[1]))
      assert(existsSync(resolve(base, link[1])), `Broken link ${link[1]}`);
}
assert.equal(cases.find((c) => c.id === 'UI-01').state, 'no ejecutado');
assert.equal(cases.find((c) => c.id === 'OPS-01').state, 'no ejecutado');
console.log(
  `Validated ${cases.length} acceptance records, evidence SHA256, local links and explicit human/Compose pending states.`,
);
