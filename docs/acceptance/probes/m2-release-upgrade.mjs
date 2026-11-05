// Dedicated empty loopback DB only. Reproduces the published M1 schema,
// inserts synthetic M1 data, then upgrades to M2 without deleting history.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const connection = process.env.QA_M2_UPGRADE_DATABASE_URL;
if (!connection)
  throw Error('Set QA_M2_UPGRADE_DATABASE_URL to a NEW dedicated empty test database.');
const url = new URL(connection);
if (
  !['postgres:', 'postgresql:'].includes(url.protocol) ||
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !/test|e2e/i.test(url.pathname)
)
  throw Error('M2 upgrade probe requires a loopback PostgreSQL test/e2e database.');

const requireDb = createRequire(resolve('packages/db/package.json'));
const { Pool } = requireDb('pg');
const { drizzle } = requireDb('drizzle-orm/node-postgres');
const { migrate } = requireDb('drizzle-orm/node-postgres/migrator');
const pool = new Pool({ connectionString: connection });
const temporaryRoot = resolve(process.env.QA_TEMP_ROOT ?? tmpdir());
let folder;

const snapshotM1 = async () => ({
  users: (await pool.query('SELECT id,email,password_hash,created_at FROM auth.users ORDER BY id'))
    .rows,
  profiles: (
    await pool.query(
      'SELECT id,user_id,full_name,headline,skills_revision,updated_at FROM app.profiles ORDER BY id',
    )
  ).rows,
  userSkills: (
    await pool.query('SELECT user_id,skill_id FROM app.user_skills ORDER BY user_id,skill_id')
  ).rows,
  analyses: (await pool.query('SELECT * FROM app.analyses ORDER BY id')).rows,
});

try {
  const existing = await pool.query(
    "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S')",
  );
  assert.equal(existing.rows[0].count, '0', 'Refusing a nonempty database.');

  folder = await mkdtemp(join(temporaryRoot, 'devpath-rel02-upgrade-'));
  await mkdir(join(folder, 'meta'));
  const migrations = resolve('packages/db/migrations');
  const journal = JSON.parse(await readFile(join(migrations, 'meta/_journal.json'), 'utf8'));
  assert.equal(journal.entries.length, 6, 'Review the M2 release probe when migrations change.');
  const m1Journal = { ...journal, entries: journal.entries.slice(0, 4) };
  await writeFile(join(folder, 'meta/_journal.json'), JSON.stringify(m1Journal));
  for (const entry of m1Journal.entries)
    await copyFile(join(migrations, entry.tag + '.sql'), join(folder, entry.tag + '.sql'));

  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: folder });
  assert.equal(
    (await pool.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count,
    '4',
  );

  const owner = randomUUID();
  const analysis = randomUUID();
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
    'INSERT INTO app.profiles(id,user_id,full_name,headline,skills_revision) VALUES($1,$1,$2,$3,1)',
    [owner, 'M1 Upgrade Synthetic', 'Existing profile'],
  );
  for (const skill of catalog.technologies)
    await pool.query('INSERT INTO app.skills(id,name,category) VALUES($1,$2,$3)', [
      skill.id,
      skill.name,
      skill.category,
    ]);
  for (const skill of ['javascript', 'react'])
    await pool.query('INSERT INTO app.user_skills(user_id,skill_id) VALUES($1,$2)', [owner, skill]);
  const requestHash = createHash('sha256')
    .update(JSON.stringify({ source: { type: 'text', title: 'Existing M1 67', text } }))
    .digest('hex');
  await pool.query(
    'INSERT INTO app.analyses(id,user_id,idempotency_key,job_title,job_text,required_skill_ids,matched_skill_ids,missing_skill_ids,compatibility_percentage,candidate_skills_revision,catalog_version,extractor_version,scoring_version,request_hash,candidate_skill_ids,warnings) VALUES($1,$2,$3,$4,$5,$6,$7,$8,67,1,$9,$10,$10,$11,$7,$12)',
    [
      analysis,
      owner,
      key,
      'Existing M1 67',
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

  const before = await snapshotM1();
  await migrate(db, { migrationsFolder: migrations });
  assert.deepEqual(await snapshotM1(), before, 'M1 rows changed during M2 upgrade.');
  assert.equal(
    (await pool.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count,
    '6',
  );
  assert.equal(
    (await pool.query('SELECT projects_revision FROM app.profiles WHERE id=$1', [owner])).rows[0]
      .projects_revision,
    0,
  );
  for (const table of ['projects', 'project_skills', 'cv_files', 'cv_cleanup'])
    assert.equal((await pool.query(`SELECT count(*) FROM app."${table}"`)).rows[0].count, '0');

  await migrate(db, { migrationsFolder: migrations });
  assert.deepEqual(await snapshotM1(), before, 'Idempotent M2 rerun changed M1 rows.');
  assert.equal(
    (await pool.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count,
    '6',
  );
  await pool.query('DELETE FROM auth.users WHERE id=$1', [owner]);
  console.log(
    'PASS M2 upgrade: M1 migrations0000-0003 and synthetic user/profile/skills/analysis preserved; migrations0004-0005 create empty projects/CV structures; rerun unchanged.',
  );
} finally {
  await pool.end();
  await removeOwnedFolder();
}

async function removeOwnedFolder() {
  if (!folder) return;
  if (
    dirname(resolve(folder)) !== temporaryRoot ||
    !basename(folder).startsWith('devpath-rel02-upgrade-')
  )
    throw Error('Unsafe cleanup path.');
  await rm(folder, { recursive: true });
}
