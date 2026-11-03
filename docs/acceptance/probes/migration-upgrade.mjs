// Dedicated empty loopback DB only; never connects to a development/demo database.
// Reproduces 0000-0002 -> 0003 with synthetic existing data and an idempotent rerun.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID, createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';

const connection = process.env.QA_UPGRADE_DATABASE_URL;
if (!connection) throw Error('Set QA_UPGRADE_DATABASE_URL to a NEW dedicated empty test database.');
const url = new URL(connection);
if (
  !['postgres:', 'postgresql:'].includes(url.protocol) ||
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !/test|e2e/i.test(url.pathname)
)
  throw Error('Upgrade probe requires a loopback PostgreSQL test/e2e database.');
const requireDb = createRequire(resolve('packages/db/package.json'));
const { Pool } = requireDb('pg');
const { drizzle } = requireDb('drizzle-orm/node-postgres');
const { migrate } = requireDb('drizzle-orm/node-postgres/migrator');
const pool = new Pool({ connectionString: connection });
const temporaryRoot = resolve(process.env.QA_TEMP_ROOT ?? tmpdir());
let folder;
try {
  // Refuse all non-system relations BEFORE applying even the historical migrations.
  const existing = await pool.query(
    "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S')",
  );
  assert.equal(
    existing.rows[0].count,
    '0',
    'Refusing a nonempty database. Create a fresh dedicated test DB.',
  );
  folder = await mkdtemp(join(temporaryRoot, 'devpath-qa02-upgrade-'));
  await mkdir(join(folder, 'meta'));
  const migrations = resolve('packages/db/migrations');
  const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8'));
  assert.equal(journal.entries.length, 4, 'Review this probe if migrations change.');
  const historical = { ...journal, entries: journal.entries.slice(0, 3) };
  await writeFile(join(folder, 'meta/_journal.json'), JSON.stringify(historical));
  for (const entry of historical.entries)
    await copyFile(join(migrations, entry.tag + '.sql'), join(folder, entry.tag + '.sql'));
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: folder });
  assert.equal(
    (await pool.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count,
    '3',
  );
  const owner = randomUUID(),
    analysis = randomUUID(),
    key = randomUUID();
  const { hash } = createRequire(resolve('apps/api/package.json'))('argon2');
  const passwordHash = await hash('Synthetic-' + randomUUID() + '!Aa1');
  const text = 'JavaScript React Git';
  const evidence = [
    ['git', 'Git'],
    ['javascript', 'JavaScript'],
    ['react', 'React'],
  ].map(([skillId, token]) => ({
    skillId,
    matches: [{ text: token, start: text.indexOf(token), end: text.indexOf(token) + token.length }],
  }));
  await pool.query('INSERT INTO auth.users(id,email,password_hash) VALUES($1,$2,$3)', [
    owner,
    randomUUID() + '@example.test',
    passwordHash,
  ]);
  await pool.query(
    'INSERT INTO app.profiles(id,user_id,full_name,skills_revision) VALUES($1,$1,$2,1)',
    [owner, 'Migration Synthetic'],
  );
  const catalog = JSON.parse(await readFile('packages/catalog/technologies.json', 'utf8'));
  for (const skill of catalog.technologies)
    await pool.query('INSERT INTO app.skills(id,name,category) VALUES($1,$2,$3)', [
      skill.id,
      skill.name,
      skill.category,
    ]);
  for (const skill of ['javascript', 'react'])
    await pool.query('INSERT INTO app.user_skills(user_id,skill_id) VALUES($1,$2)', [owner, skill]);
  const requestHash = createHash('sha256')
    .update(JSON.stringify({ source: { type: 'text', title: 'Migration 67', text } }))
    .digest('hex');
  await pool.query(
    'INSERT INTO app.analyses(id,user_id,idempotency_key,job_title,job_text,required_skill_ids,matched_skill_ids,missing_skill_ids,compatibility_percentage,candidate_skills_revision,catalog_version,extractor_version,scoring_version,request_hash,candidate_skill_ids,evidence,warnings) VALUES($1,$2,$3,$4,$5,$6,$7,$8,67,1,$9,$10,$10,$11,$7,$12::jsonb,$13)',
    [
      analysis,
      owner,
      key,
      'Migration 67',
      text,
      ['git', 'javascript', 'react'],
      ['javascript', 'react'],
      ['git'],
      catalog.version,
      '1.1.0',
      requestHash,
      JSON.stringify(evidence),
      [],
    ],
  );
  const snapshot = async () => ({
    users: (await pool.query('SELECT * FROM auth.users ORDER BY id')).rows,
    profiles: (await pool.query('SELECT * FROM app.profiles ORDER BY id')).rows,
    skills: (await pool.query('SELECT * FROM app.user_skills ORDER BY id')).rows,
    analyses: (await pool.query('SELECT * FROM app.analyses ORDER BY id')).rows,
  });
  const before = await snapshot();
  await migrate(db, { migrationsFolder: migrations });
  assert.deepEqual(await snapshot(), before);
  assert.equal(
    (await pool.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count,
    '4',
  );
  assert.equal(
    (
      await pool.query(
        "SELECT count(*) FROM pg_indexes WHERE schemaname='app' AND indexname='analyses_user_created_id_idx'",
      )
    ).rows[0].count,
    '1',
  );
  await migrate(db, { migrationsFolder: migrations });
  assert.deepEqual(await snapshot(), before);
  assert.equal(
    (await pool.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count,
    '4',
  );
  await pool.query('DELETE FROM auth.users WHERE id=$1', [owner]);
  assert.equal((await pool.query('SELECT count(*) FROM app.analyses')).rows[0].count, '0');
  console.log(
    'PASS migration upgrade: historical0000-0002 + real synthetic user/profile/skills/67% analysis/evidence/key;0003 preserves all rows, adds cursor index, rerun unchanged; fixture user cleaned.',
  );
} finally {
  await pool.end();
  await removeOwnedFolder();
}
async function removeOwnedFolder() {
  if (!folder) return;
  if (
    dirname(resolve(folder)) !== temporaryRoot ||
    !basename(folder).startsWith('devpath-qa02-upgrade-')
  )
    throw Error('Unsafe cleanup path.');
  await rm(folder, { recursive: true });
}
