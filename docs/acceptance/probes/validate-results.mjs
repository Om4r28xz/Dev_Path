// Structural consistency only; this does not approve human acceptance or rerun tests.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';

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
const documents = ['M1-results.md', 'P5-review.md', 'REL-01-checklist.md'];
for (const name of [
  'READINESS-M1.md',
  'P5-review-form.md',
  'OPS-01-runbook.md',
  'defects/M1-A11Y-001.md',
  '../release/M1-VERSION-PLAN.md',
  '../release/M1-CHANGELOG-DRAFT.md',
  '../release/M1-PUBLICATION-PLAN.md',
  '../release/M1-ROLLBACK-PLAN.md',
]) {
  if (existsSync(base + '/' + name)) documents.push(name);
}
if (existsSync(base + '/evidence/readiness-manifest.json')) {
  const readiness = JSON.parse(readFileSync(base + '/evidence/readiness-manifest.json', 'utf8'));
  for (const entry of readiness.files)
    assert.equal(
      createHash('sha256').update(readFileSync(entry.file)).digest('hex'),
      entry.sha256,
      `Readiness evidence changed: ${entry.file}`,
    );
  const original = JSON.parse(
    readFileSync(base + '/evidence/readiness-accessibility.json', 'utf8'),
  );
  const fixed = JSON.parse(
    readFileSync(base + '/evidence/readiness-accessibility-fixed.json', 'utf8'),
  );
  assert.equal(original.productCommit, readiness.integratedCommit);
  assert.equal(fixed.productCommit, readiness.codeFixCommit);
  assert(
    original.results.some((screen) =>
      screen.violations.some((finding) => finding.id === 'target-size'),
    ),
  );
  assert(fixed.results.every((screen) => screen.violations.length === 0));
  assert.equal(readiness.humanApprovals.length, 0);
  assert.equal(readiness.release.branchCreated, false);
}
if (existsSync(base + '/evidence/final06-manifest.json')) {
  const final = JSON.parse(readFileSync(base + '/evidence/final06-manifest.json', 'utf8'));
  for (const entry of final.files)
    assert.equal(
      createHash('sha256').update(readFileSync(entry.file)).digest('hex'),
      entry.sha256,
      `Final evidence changed: ${entry.file}`,
    );
  const contrast = JSON.parse(readFileSync(base + '/evidence/contrast-recheck.json', 'utf8'));
  assert.equal(contrast.productCommit, final.productCommit);
  assert.equal(contrast.measurements.length, 2);
  for (const sample of contrast.measurements) {
    assert(sample.ratio >= 4.5 && sample.opaqueColors);
    assert(sample.coverage.every((point) => point.targetOnTop));
    assert(sample.axe.incomplete.includes('color-contrast'), 'Preserve the actual scanner outcome');
  }
  assert.equal(final.ops.stackExecuted, false);
  assert.equal(final.humanApprovals.length, 0);
  assert.equal(final.releaseBranchCreated, false);
}
if (existsSync(base + '/INTEGRATION-AUDIT.md')) documents.push('INTEGRATION-AUDIT.md');
if (existsSync(base + '/evidence/integration-correction.json')) {
  const correction = JSON.parse(
    readFileSync(base + '/evidence/integration-correction.json', 'utf8'),
  );
  for (const field of ['targetDevelop', 'main', 'sourceQa'])
    assert(/^[a-f0-9]{40}$/.test(correction[field]));
  for (const entry of correction.files)
    assert.equal(
      createHash('sha256').update(readFileSync(entry.file)).digest('hex'),
      entry.sha256,
      `Correction evidence changed: ${entry.file}`,
    );
}
for (const name of documents) {
  const content = readFileSync(base + '/' + name, 'utf8');
  assert(!/^(<<<<<<<|=======|>>>>>>>)/m.test(content));
  for (const link of content.matchAll(/\]\(([^)]+)\)/g))
    if (!/^(https?:|#)/.test(link[1]))
      assert(existsSync(resolve(dirname(base + '/' + name), link[1])), `Broken link ${link[1]}`);
}
assert.equal(cases.find((c) => c.id === 'UI-01').state, 'no ejecutado');
assert.equal(cases.find((c) => c.id === 'OPS-01').state, 'no ejecutado');
console.log(
  `Validated ${cases.length} acceptance records, evidence SHA256, local links and explicit human/Compose pending states.`,
);
