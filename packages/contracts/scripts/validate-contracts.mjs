import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const documents = {};

for (const name of ['public', 'engine']) {
  const sourcePath = path.join(packageRoot, 'openapi', `${name}.yaml`);
  const source = await readFile(sourcePath, 'utf8');
  const document = YAML.parse(source);
  assert.equal(document.openapi, '3.1.0', `${name}.yaml must use OpenAPI 3.1.0`);
  assert.ok(
    document.paths && Object.keys(document.paths).length > 0,
    `${name}.yaml must define paths`,
  );
  documents[name] = { document, sourcePath };

  const operationIds = [];
  for (const pathItem of Object.values(document.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      if (pathItem[method]) operationIds.push(pathItem[method].operationId);
    }
  }
  assert.ok(operationIds.every(Boolean), `${name}.yaml operations must have operationId`);
  assert.equal(
    new Set(operationIds).size,
    operationIds.length,
    `${name}.yaml operationIds must be unique`,
  );
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const manifest = JSON.parse(
  await readFile(path.join(packageRoot, 'examples', 'manifest.json'), 'utf8'),
);
const validatedExamples = new Map();

for (const entry of manifest.examples) {
  const document = documents[entry.document]?.document;
  assert.ok(document, `Unknown OpenAPI document: ${entry.document}`);
  assert.ok(document.components?.schemas?.[entry.schema], `Unknown schema ${entry.schema}`);
  const examplePath = path.join(packageRoot, 'examples', entry.file);
  const example = JSON.parse(await readFile(examplePath, 'utf8'));
  const schema = {
    $ref: `#/components/schemas/${entry.schema}`,
    components: { schemas: document.components.schemas },
  };
  const validate = ajv.compile(schema);
  assert.ok(
    validate(example),
    `${entry.file} failed ${entry.schema}: ${ajv.errorsText(validate.errors)}`,
  );
  validatedExamples.set(entry.file, example);
}

for (const file of [
  'internal/analyze-response.json',
  'internal/analyze-no-requirements-response.json',
]) {
  const result = validatedExamples.get(file);
  const required = new Set(result.requiredSkillIds);
  const matched = new Set(result.matchedSkillIds);
  const missing = new Set(result.missingSkillIds);
  assert.ok(
    [...matched].every((id) => required.has(id)),
    `${file}: matched must be required`,
  );
  assert.ok(
    [...missing].every((id) => required.has(id)),
    `${file}: missing must be required`,
  );
  assert.ok(
    [...matched].every((id) => !missing.has(id)),
    `${file}: matched and missing must be disjoint`,
  );
  assert.deepEqual(
    new Set([...matched, ...missing]),
    required,
    `${file}: matched and missing must partition required`,
  );
  const expected = required.size === 0 ? null : Math.round((100 * matched.size) / required.size);
  assert.equal(
    result.matchPercentage,
    expected,
    `${file}: matchPercentage must follow the documented formula`,
  );
}

const publicAnalysis = validatedExamples.get('public/analysis-response.json');
const expectedPublicPercentage = Math.round(
  (100 * publicAnalysis.matchedSkillIds.length) / publicAnalysis.requiredSkillIds.length,
);
assert.equal(
  publicAnalysis.compatibilityPercentage,
  expectedPublicPercentage,
  'Public analysis percentage must follow the same formula',
);

const engineRequestProperties = Object.keys(
  documents.engine.document.components.schemas.AnalyzeRequest.properties,
);
for (const forbidden of ['userId', 'email', 'name', 'password', 'cv']) {
  assert.ok(
    !engineRequestProperties.includes(forbidden),
    `Engine request must not expose ${forbidden}`,
  );
}

const contractHash = createHash('sha256')
  .update(await readFile(documents.public.sourcePath))
  .update(await readFile(documents.engine.sourcePath))
  .digest('hex');
const generatedHash = (
  await readFile(path.join(packageRoot, 'src', '.openapi.sha256'), 'utf8')
).trim();
assert.equal(generatedHash, contractHash, 'Generated TypeScript is stale; run pnpm generate');

const serializedPublicContract = JSON.stringify(
  documents.public.document.components.schemas.SessionResponse,
);
assert.ok(
  !serializedPublicContract.toLowerCase().includes('refreshtoken'),
  'SessionResponse must not expose a refresh token',
);

console.log(`Validated 2 OpenAPI documents and ${manifest.examples.length} JSON examples.`);
