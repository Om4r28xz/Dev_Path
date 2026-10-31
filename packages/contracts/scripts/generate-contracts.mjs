import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { format, resolveConfig } from 'prettier';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prettierConfig = (await resolveConfig(packageRoot)) ?? {};
const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve('swagger-typescript-api/package.json');
const generatorPackage = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const cliPath = path.resolve(
  path.dirname(packageJsonPath),
  generatorPackage.bin['swagger-typescript-api'],
);

for (const name of ['public', 'engine']) {
  const outputDirectory = path.join(packageRoot, 'src', name === 'public' ? 'public' : 'internal');
  const result = spawnSync(
    process.execPath,
    [
      cliPath,
      'generate',
      '--path',
      path.join(packageRoot, 'openapi', `${name}.yaml`),
      '--output',
      outputDirectory,
      '--name',
      'generated.ts',
      '--no-client',
      '--sort-types',
      '--enum-style',
      'union',
      '--silent',
    ],
    { encoding: 'utf8' },
  );
  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout || `Generation failed for ${name}`);
  const generatedPath = path.join(outputDirectory, 'generated.ts');
  const generated = await readFile(generatedPath, 'utf8');
  await writeFile(
    generatedPath,
    await format(generated, { ...prettierConfig, parser: 'typescript' }),
  );
}

const hash = createHash('sha256');
for (const name of ['public', 'engine'])
  hash.update(await readFile(path.join(packageRoot, 'openapi', `${name}.yaml`)));
await writeFile(path.join(packageRoot, 'src', '.openapi.sha256'), `${hash.digest('hex')}\n`);
console.log('Generated public and internal TypeScript contracts from OpenAPI.');
