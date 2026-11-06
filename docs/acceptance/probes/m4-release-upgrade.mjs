// Dedicated empty loopback DB only. Reproduces the published v0.3.0 schema (0000-0005),
// inserts synthetic M1/M2/M3 data, then upgrades to v0.4.0 (0006) without deleting history.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const connection = process.env.QA_M4_UPGRADE_DATABASE_URL;
if (!connection)
  throw Error('Set QA_M4_UPGRADE_DATABASE_URL to a NEW dedicated empty test database.');
const url = new URL(connection);
if (
  !['postgres:', 'postgresql:'].includes(url.protocol) ||
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !/test|e2e/i.test(url.pathname)
)
  throw Error('M4 upgrade probe requires a loopback PostgreSQL test/e2e database.');

const requireDb = createRequire(resolve('packages/db/package.json'));
const { Pool } = requireDb('pg');
const { drizzle } = requireDb('drizzle-orm/node-postgres');
const { migrate } = requireDb('drizzle-orm/node-postgres/migrator');
const pool = new Pool({ connectionString: connection });
const temporaryRoot = resolve(process.env.QA_TEMP_ROOT ?? tmpdir());
let folder;

const snapshotPreM4 = async () => ({
  users: (await pool.query('SELECT id,email,password_hash,created_at FROM auth.users ORDER BY id'))
    .rows,
  profiles: (
    await pool.query(
      'SELECT id,user_id,full_name,headline,skills_revision,projects_revision,updated_at FROM app.profiles ORDER BY id',
    )
  ).rows,
  userSkills: (
    await pool.query('SELECT user_id,skill_id FROM app.user_skills ORDER BY user_id,skill_id')
  ).rows,
  analyses: (await pool.query('SELECT * FROM app.analyses ORDER BY id')).rows,
  projects: (await pool.query('SELECT * FROM app.projects ORDER BY id')).rows,
  projectSkills: (
    await pool.query(
      'SELECT project_id,skill_id FROM app.project_skills ORDER BY project_id,skill_id',
    )
  ).rows,
  cvFiles: (await pool.query('SELECT * FROM app.cv_files ORDER BY id')).rows,
});

try {
  const existing = await pool.query(
    "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S')",
  );
  assert.equal(existing.rows[0].count, '0', 'Refusing a nonempty database.');

  folder = await mkdtemp(join(temporaryRoot, 'devpath-rel04-upgrade-'));
  await mkdir(join(folder, 'meta'));
  const migrations = resolve('packages/db/migrations');
  const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8'));
  assert.equal(journal.entries.length, 7, 'Expected 7 migrations (0000-0006) in v0.4.0.');
  const m3Journal = { ...journal, entries: journal.entries.slice(0, 6) };
  await writeFile(join(folder, 'meta/_journal.json'), JSON.stringify(m3Journal));
  for (const entry of m3Journal.entries)
    await copyFile(join(migrations, entry.tag + '.sql'), join(folder, entry.tag + '.sql'));

  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: folder });
  assert.equal(
    (await pool.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count,
    '6',
  );

  const owner = randomUUID();
  const analysis = randomUUID();
  const project = randomUUID();
  const cvId = randomUUID();
  const key = randomUUID();
  const { hash } = createRequire(resolve('apps/api/package.json'))('argon2');
  const passwordHash = await hash('Synthetic-' + randomUUID() + '!Aa1');
  const text = 'JavaScript React Git';
  const catalog = JSON.parse(await readFile('packages/catalog/technologies.json', 'utf8'));
  await pool.query('INSERT INTO auth.users(id,email,password_hash) VALUES($1,$2,$3)', [
    owner,
    randomUUID() + '@example.test',
    passwordHash,
  ]);
  await pool.query(
    'INSERT INTO app.profiles(id,user_id,full_name,headline,skills_revision,projects_revision) VALUES($1,$1,$2,$3,1,1)',
    [owner, 'M3 Upgrade Synthetic', 'Existing profile before M4'],
  );
  for (const skill of catalog.technologies)
    await pool.query('INSERT INTO app.skills(id,name,category) VALUES($1,$2,$3)', [
      skill.id,
      skill.name,
      skill.category,
    ]);
  for (const skill of ['javascript', 'react'])
    await pool.query('INSERT INTO app.user_skills(user_id,skill_id) VALUES($1,$2)', [owner, skill]);
  await pool.query(
    'INSERT INTO app.projects(id,user_id,title,description,url) VALUES($1,$2,$3,$4,$5)',
    [project, owner, 'Synthetic M2 Project', 'Existing portfolio item', 'https://example.test/p'],
  );
  await pool.query('INSERT INTO app.project_skills(project_id,skill_id) VALUES($1,$2)', [
    project,
    'javascript',
  ]);
  await pool.query(
    'INSERT INTO app.cv_files(id,user_id,storage_key,original_name,mime_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6)',
    [cvId, owner, `cv/${owner}/${cvId}.pdf`, 'synthetic-cv.pdf', 'application/pdf', 128],
  );
  const requestHash = createHash('sha256')
    .update(JSON.stringify({ source: { type: 'text', title: 'Existing M3 67', text } }))
    .digest('hex');
  await pool.query(
    'INSERT INTO app.analyses(id,user_id,idempotency_key,job_title,job_text,required_skill_ids,matched_skill_ids,missing_skill_ids,compatibility_percentage,candidate_skills_revision,catalog_version,extractor_version,scoring_version,request_hash,candidate_skill_ids,warnings) VALUES($1,$2,$3,$4,$5,$6,$7,$8,67,1,$9,$10,$10,$11,$7,$12)',
    [
      analysis,
      owner,
      key,
      'Existing M3 67',
      text,
      ['git', 'javascript', 'react'],
      ['javascript', 'react'],
      ['git'],
      catalog.version,
      '1.1.0',
      requestHash,
      [],
    ],
  );

  const before = await snapshotPreM4();
  await migrate(db, { migrationsFolder: migrations });
  assert.deepEqual(await snapshotPreM4(), before, 'Pre-M4 rows changed during v0.4.0 upgrade.');
  assert.equal(
    (await pool.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count,
    '7',
  );
  for (const table of ['learning_paths', 'learning_path_steps'])
    assert.equal((await pool.query(`SELECT count(*) FROM app."${table}"`)).rows[0].count, '0');

  await migrate(db, { migrationsFolder: migrations });
  assert.deepEqual(await snapshotPreM4(), before, 'Idempotent M4 rerun changed existing rows.');
  assert.equal(
    (await pool.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count,
    '7',
  );
  await pool.query('DELETE FROM auth.users WHERE id=$1', [owner]);
  console.log(
    'PASS M4 upgrade: v0.3.0 migrations 0000-0005 and synthetic user/profile/skills/project/CV/analysis preserved; migration 0006 creates empty learning_paths/learning_path_steps structures; rerun unchanged.',
  );
} finally {
  await pool.end();
  await removeOwnedFolder();
}

async function removeOwnedFolder() {
  if (!folder) return;
  if (
    dirname(resolve(folder)) !== temporaryRoot ||
    !basename(folder).startsWith('devpath-rel04-upgrade-')
  )
    throw Error('Unsafe cleanup path.');
  await rm(folder, { recursive: true });
}
