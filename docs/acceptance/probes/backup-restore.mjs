// Only two NEW empty loopback test DBs. No --clean, drop or existing data replacement.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, chmod } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';

function testUrl(value) {
  if (!value)
    throw Error('Set QA_BACKUP_SOURCE_URL and QA_BACKUP_TARGET_URL to NEW empty test databases.');
  const url = new URL(value);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    !/test|e2e/i.test(url.pathname)
  )
    throw Error('Only loopback PostgreSQL test/e2e DBs allowed.');
  return url;
}
const source = testUrl(process.env.QA_BACKUP_SOURCE_URL);
const target = testUrl(process.env.QA_BACKUP_TARGET_URL);
assert.notEqual(source.href, target.href, 'Source and restore target must differ.');
assert.notEqual(source.pathname, target.pathname, 'Use distinct database names.');
if (!process.env.QA_PG_BIN) throw Error('Set QA_PG_BIN to existing PostgreSQL binaries.');
const requireDb = createRequire(resolve('packages/db/package.json'));
const { Pool } = requireDb('pg');
const { drizzle } = requireDb('drizzle-orm/node-postgres');
const { migrate } = requireDb('drizzle-orm/node-postgres/migrator');
const pools = [
  new Pool({ connectionString: source.href }),
  new Pool({ connectionString: target.href }),
];
const temporaryRoot = resolve(process.env.QA_TEMP_ROOT ?? tmpdir());
let folder;
try {
  for (const pool of pools) {
    const existing = await pool.query(
      "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S')",
    );
    assert.equal(
      existing.rows[0].count,
      '0',
      'Refusing nonempty source/target before modifying either database.',
    );
  }
  await migrate(drizzle(pools[0]), { migrationsFolder: resolve('packages/db/migrations') });
  const owner = randomUUID(),
    id = randomUUID();
  const { hash } = createRequire(resolve('apps/api/package.json'))('argon2');
  await pools[0].query('INSERT INTO auth.users(id,email,password_hash) VALUES($1,$2,$3)', [
    owner,
    randomUUID() + '@example.test',
    await hash('Synthetic-' + randomUUID() + '!Aa1'),
  ]);
  await pools[0].query(
    'INSERT INTO app.profiles(id,user_id,full_name,skills_revision) VALUES($1,$1,$2,1)',
    [owner, 'Backup Synthetic'],
  );
  await pools[0].query('INSERT INTO app.skills(id,name,category) VALUES($1,$2,$3)', [
    'javascript',
    'JavaScript',
    'language',
  ]);
  await pools[0].query('INSERT INTO app.user_skills(user_id,skill_id) VALUES($1,$2)', [
    owner,
    'javascript',
  ]);
  const evidence = [
    { skillId: 'javascript', matches: [{ text: 'JavaScript', start: 0, end: 10 }] },
  ];
  await pools[0].query(
    'INSERT INTO app.analyses(id,user_id,idempotency_key,job_title,job_text,required_skill_ids,matched_skill_ids,missing_skill_ids,compatibility_percentage,candidate_skills_revision,catalog_version,extractor_version,scoring_version,request_hash,candidate_skill_ids,evidence) VALUES($1,$2,$3,$4,$5,$6,$6,$7,100,1,$8,$9,$9,$10,$6,$11::jsonb)',
    [
      id,
      owner,
      randomUUID(),
      'Backup Snapshot',
      'JavaScript',
      ['javascript'],
      [],
      '1.0.0',
      '1.1.0',
      'a'.repeat(64),
      JSON.stringify(evidence),
    ],
  );
  const tables = [
    'auth.users',
    'app.profiles',
    'app.skills',
    'app.user_skills',
    'app.analyses',
    'drizzle.__drizzle_migrations',
  ];
  const snapshot = async (pool) =>
    Object.fromEntries(
      await Promise.all(
        tables.map(async (table) => [
          table,
          (await pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows,
        ]),
      ),
    );
  const before = await snapshot(pools[0]);
  folder = await mkdtemp(join(temporaryRoot, 'devpath-qa-backup-'));
  const dump = join(folder, 'synthetic.dump');
  const cli = (name, url, args) =>
    execFileSync(
      join(process.env.QA_PG_BIN, name + (process.platform === 'win32' ? '.exe' : '')),
      args,
      {
        stdio: 'ignore',
        windowsHide: true,
        timeout: 30000,
        env: {
          ...process.env,
          PGHOST: url.hostname.replace(/^\[|\]$/g, ''),
          PGPORT: url.port || '5432',
          PGUSER: decodeURIComponent(url.username),
          PGPASSWORD: decodeURIComponent(url.password),
          PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
        },
      },
    );
  cli('pg_dump', source, ['--format=custom', '--file', dump]);
  await chmod(dump, 0o600);
  cli('pg_restore', target, [
    '--no-owner',
    '--no-acl',
    '--exit-on-error',
    '--dbname',
    decodeURIComponent(target.pathname.slice(1)),
    dump,
  ]);
  assert.deepEqual(await snapshot(pools[1]), before);
  await migrate(drizzle(pools[1]), { migrationsFolder: resolve('packages/db/migrations') });
  assert.deepEqual(await snapshot(pools[1]), before, 'Migration rerun after restore changed rows.');
  for (const pool of pools) await pool.query('DELETE FROM auth.users WHERE id=$1', [owner]);
  console.log(
    'PASS backup/restore: custom pg_dump -> new empty DB; user/profile/skills/analysis/evidence/key/hash/migration journal identical; migrate rerun unchanged; synthetic account cleaned in both DBs.',
  );
} finally {
  await Promise.all(pools.map((pool) => pool.end()));
  await removeOwnedFolder();
}
async function removeOwnedFolder() {
  if (!folder) return;
  if (
    dirname(resolve(folder)) !== temporaryRoot ||
    !basename(folder).startsWith('devpath-qa-backup-')
  )
    throw Error('Unsafe cleanup path.');
  await rm(folder, { recursive: true });
}
