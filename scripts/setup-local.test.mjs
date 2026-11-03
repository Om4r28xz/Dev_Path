import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  statSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'devpath-setup-test-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'infra'));
    copyFileSync(
      new URL('./setup-local.mjs', import.meta.url),
      join(root, 'scripts/setup-local.mjs'),
    );
    const setup = () =>
      spawnSync(process.execPath, [join(root, 'scripts/setup-local.mjs')], {
        encoding: 'utf8',
        windowsHide: true,
      });
    run(root, setup);
  } finally {
    rmSync(root, { recursive: true });
  }
}

test('setup generates owner-only key and matching non-root Compose identity; rerun preserves secrets', () =>
  fixture((root, setup) => {
    assert.equal(setup().status, 0);
    const key = join(root, '.local-data/keys/access-private.pem');
    const env = join(root, 'infra/.env');
    const before = [readFileSync(key), readFileSync(env)];
    const uid = process.getuid?.() ?? 1000;
    const gid = process.getgid?.() ?? 1000;
    assert(uid > 0 && gid > 0);
    assert.match(before[1].toString(), new RegExp('^LOCAL_UID=' + uid + '$', 'm'));
    assert.match(before[1].toString(), new RegExp('^LOCAL_GID=' + gid + '$', 'm'));
    if (process.platform !== 'win32') {
      assert.equal(statSync(key).uid, uid);
      assert.equal(statSync(key).mode & 0o777, 0o600);
    }
    assert.equal(setup().status, 0);
    assert.deepEqual([readFileSync(key), readFileSync(env)], before);
  }));

test('setup upgrades old env without rotating credentials or existing key', () =>
  fixture((root, setup) => {
    const env = join(root, 'infra/.env');
    const original =
      'POSTGRES_PASSWORD=synthetic-preserved\nENGINE_SERVICE_SECRET=synthetic-preserved\n';
    writeFileSync(env, original, { mode: 0o600 });
    assert.equal(setup().status, 0);
    assert(readFileSync(env, 'utf8').startsWith(original));
    assert.equal((readFileSync(env, 'utf8').match(/^LOCAL_UID=/gm) ?? []).length, 1);
  }));

test('setup rejects root identity override without overwriting existing env', () =>
  fixture((root, setup) => {
    const env = join(root, 'infra/.env');
    const original = 'LOCAL_UID=0\nLOCAL_GID=0\n';
    writeFileSync(env, original, { mode: 0o600 });
    const result = setup();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not match the invoking user/);
    assert.equal(readFileSync(env, 'utf8'), original);
  }));
