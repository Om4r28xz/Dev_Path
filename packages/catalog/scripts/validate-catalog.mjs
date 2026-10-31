import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(path.join(root, 'technologies.json'), 'utf8'));
const requiredIds = [
  'java',
  'javascript',
  'react',
  'react-native',
  'nodejs',
  'git',
  'docker',
  'sql',
  'csharp',
  'cplusplus',
];
const categories = new Set(['language', 'library', 'framework', 'runtime', 'tool', 'platform']);
const normalize = (value) =>
  value
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ');

assert.equal(catalog.version, '1.0.0', 'Catalog version must be 1.0.0');
assert.ok(
  Array.isArray(catalog.technologies) && catalog.technologies.length > 0,
  'technologies must be a non-empty array',
);

const ids = new Set();
const names = new Set();
const aliases = new Map();
for (const technology of catalog.technologies) {
  assert.match(technology.id, /^[a-z][a-z0-9-]*$/, `Invalid id: ${technology.id}`);
  assert.ok(!ids.has(technology.id), `Duplicate id: ${technology.id}`);
  ids.add(technology.id);
  assert.ok(
    typeof technology.name === 'string' && technology.name.trim(),
    `Missing name for ${technology.id}`,
  );
  const normalizedName = normalize(technology.name);
  assert.ok(!names.has(normalizedName), `Duplicate name: ${technology.name}`);
  names.add(normalizedName);
  assert.ok(categories.has(technology.category), `Invalid category for ${technology.id}`);
  assert.ok(
    Array.isArray(technology.aliases) && technology.aliases.length > 0,
    `Missing aliases for ${technology.id}`,
  );

  for (const alias of technology.aliases) {
    assert.ok(
      typeof alias.value === 'string' && alias.value.trim(),
      `Empty alias for ${technology.id}`,
    );
    assert.ok(
      typeof alias.reason === 'string' && alias.reason.trim().length >= 20,
      `Alias reason too short for ${technology.id}`,
    );
    const key = normalize(alias.value);
    assert.ok(
      !aliases.has(key),
      `Alias ${alias.value} collides between ${aliases.get(key)} and ${technology.id}`,
    );
    aliases.set(key, technology.id);
  }
}

for (const id of requiredIds) assert.ok(ids.has(id), `Required technology is missing: ${id}`);
console.log(
  `Validated catalog ${catalog.version}: ${ids.size} technologies and ${aliases.size} unambiguous aliases.`,
);
