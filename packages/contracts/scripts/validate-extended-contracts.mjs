import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { contractDocuments } from './contract-documents.mjs';

const origin = 'https://contracts.devpath.test/';
const methods = ['get', 'post', 'put', 'patch', 'delete'];

export async function validateExtendedContracts({
  packageRoot,
  documents,
  ajv,
  validatedExamples,
}) {
  // Resolve every local/cross-document reference, including response/parameter refs
  // that JSON Schema validation alone would never visit.
  function resolve(reference, current) {
    const url = new URL(reference, `${origin}${current}.yaml`);
    assert.equal(url.origin, new URL(origin).origin, 'Contract refs must remain local');
    const name = path.basename(url.pathname, '.yaml');
    let value = documents[name]?.document;
    assert.ok(value, `Unknown reference document: ${reference}`);
    for (const token of url.hash.slice(2).split('/').filter(Boolean)) {
      const key = decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~');
      assert.ok(Object.hasOwn(value, key), `Broken reference: ${current}: ${reference}`);
      value = value[key];
    }
    return value;
  }
  function walk(value, name) {
    if (!value || typeof value !== 'object') return;
    if (value.$ref) resolve(value.$ref, name);
    for (const child of Object.values(value)) walk(child, name);
  }
  for (const [name, { document }] of Object.entries(documents)) {
    walk(document, name);
    for (const schema of Object.keys(document.components.schemas))
      ajv.compile({ $ref: `${origin}${name}.yaml#/components/schemas/${schema}` });
    if (['public', 'engine'].includes(name)) continue;
    assert.equal(document.servers[0].url, '/api/v1');
    assert.deepEqual(document.security, [{ bearerAuth: [] }]);
    assert.equal(document['x-contract-status'], name === 'm2' ? 'defined-for-M2' : 'proposed');
    for (const [route, item] of Object.entries(document.paths)) {
      for (const method of methods) {
        const operation = item[method];
        if (!operation) continue;
        assert.equal(operation['x-implementation-status'], 'not-implemented');
        assert.ok(!operation.security, `${operation.operationId}: must inherit bearer auth`);
        assert.ok(operation.responses[401], `${operation.operationId}: missing 401`);
        const unauthorized = resolve(operation.responses[401].$ref, name).content[
          'application/json'
        ];
        assert.equal(unauthorized.schema.$ref, './public.yaml#/components/schemas/ErrorResponse');
        assert.equal(unauthorized.example.error.code, 'UNAUTHENTICATED');
        assert.equal(
          ajv.validate(
            { $ref: `${origin}public.yaml#/components/schemas/ErrorResponse` },
            unauthorized.example,
          ),
          true,
        );
        const parameters = [...(item.parameters ?? []), ...(operation.parameters ?? [])].map(
          (parameter) => (parameter.$ref ? resolve(parameter.$ref, name) : parameter),
        );
        for (const match of route.matchAll(/\{([^}]+)\}/g))
          assert.ok(parameters.some((p) => p.in === 'path' && p.name === match[1] && p.required));
        for (const status of Object.keys(operation.responses)) assert.match(status, /^[1-5]\d\d$/);
        const mediaTypes = [
          ...Object.values(operation.requestBody?.content ?? {}),
          ...Object.values(operation.responses).flatMap((r) => Object.values(r.content ?? {})),
        ];
        for (const media of mediaTypes) {
          if (media.example === undefined) continue;
          assert.ok(media.schema.$ref, 'Inline example must reference a named schema');
          const schemaUrl = new URL(media.schema.$ref, `${origin}${name}.yaml`).href;
          assert.equal(
            ajv.validate({ $ref: schemaUrl }, media.example),
            true,
            `${operation.operationId}: invalid inline example: ${ajv.errorsText(ajv.errors)}`,
          );
        }
      }
    }
  }

  const m2 = documents.m2.document;
  assert.equal(m2.components.schemas.CvUpload.properties.file['x-maxBytes'], 5 * 1024 * 1024);
  assert.equal(m2.components.schemas.CvMetadata.properties.sizeBytes.maximum, 5 * 1024 * 1024);
  assert.deepEqual(m2.components.schemas.CvUpload.required, ['file']);
  assert.equal(m2.components.schemas.CvUpload.additionalProperties, false);
  const download = m2.paths['/me/cv/download'].get.responses[200];
  assert.equal(
    download.headers['Content-Disposition'].schema.const,
    'attachment; filename="cv.pdf"',
  );
  assert.equal(download.headers['Cache-Control'].schema.const, 'no-store');
  assert.ok(download.content['application/pdf']);
  assert.ok(m2.paths['/me/cv'].put.responses[413]);
  assert.ok(m2.paths['/me/cv'].put.responses[415]);
  for (const schema of ['CreateProjectRequest', 'UpdateProjectRequest', 'Project', 'CvMetadata']) {
    assert.equal(m2.components.schemas[schema].additionalProperties, false);
    assert.ok(!Object.hasOwn(m2.components.schemas[schema].properties, 'userId'));
    assert.ok(!Object.hasOwn(m2.components.schemas[schema].properties, 'storageKey'));
  }

  const m3 = documents['m3-proposed'].document;
  assert.deepEqual(Object.keys(m3.paths).sort(), ['/analyses', '/jobs', '/jobs/details']);
  assert.equal(
    m3.paths['/analyses'].post.parameters[0].$ref,
    './public.yaml#/components/parameters/IdempotencyKey',
  );
  assert.ok(m3.paths['/analyses'].post.responses[200]);
  assert.ok(m3.paths['/analyses'].post.responses[201]);
  assert.ok(m3.paths['/analyses'].post.responses[409]);
  const analysis = validatedExamples.get('m3-proposed/analysis.json');
  assert.equal(
    ajv.validate({ $ref: `${origin}public.yaml#/components/schemas/Analysis` }, analysis),
    false,
    'Future jsearch source must not silently become valid in M1',
  );
  const original = documents.public.document.components.schemas.Analysis;
  assert.deepEqual(
    Object.keys(m3.components.schemas.ProposedJSearchAnalysis.properties),
    Object.keys(original.properties),
  );
  for (const key of Object.keys(original.properties))
    if (key !== 'source')
      assert.equal(
        m3.components.schemas.ProposedJSearchAnalysis.properties[key].$ref,
        `./public.yaml#/components/schemas/Analysis/properties/${key}`,
      );

  const m4 = documents['m4-proposed'].document;
  assert.ok(m4.paths['/learning-paths'].post.responses[409]);
  assert.equal(
    m4.paths['/learning-paths'].post.parameters[0].$ref,
    './public.yaml#/components/parameters/IdempotencyKey',
  );
  for (const [file, result] of validatedExamples) {
    if (!file.startsWith('m4-proposed/path') || !result.steps) continue;
    const completed = result.steps.filter((step) => step.status === 'completed').length;
    assert.equal(result.progress.completed, completed, `${file}: completed count`);
    assert.equal(result.progress.total, result.steps.length, `${file}: total count`);
    assert.equal(
      result.progress.percentage,
      result.steps.length ? Math.round((100 * completed) / result.steps.length) : null,
      `${file}: derived progress`,
    );
  }

  const hash = createHash('sha256');
  for (const { name } of contractDocuments) hash.update(await readFile(documents[name].sourcePath));
  assert.equal(
    (await readFile(path.join(packageRoot, 'src/.extended-openapi.sha256'), 'utf8')).trim(),
    hash.digest('hex'),
    'Extended generated types are stale; run pnpm generate',
  );
}
