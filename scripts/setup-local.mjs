import { generateKeyPairSync, randomBytes } from 'node:crypto';
import {
  mkdirSync,
  existsSync,
  writeFileSync,
  readFileSync,
  appendFileSync,
  statSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Linux bind mounts retain numeric ownership. Match the invoking non-root user,
// rather than widening the private key's permissions or running the API as root.
const uid = process.getuid?.() ?? 1000;
const gid = process.getgid?.() ?? 1000;
if (uid === 0 || gid === 0) throw Error('Run setup-local as a non-root user/group, without sudo.');
const keys = path.join(root, '.local-data/keys');
mkdirSync(keys, { recursive: true });
const privatePath = path.join(keys, 'access-private.pem');
if (existsSync(privatePath) && process.platform !== 'win32') {
  const key = statSync(privatePath);
  if (key.uid !== uid || (key.mode & 0o777) !== 0o600)
    throw Error(
      'Existing private key must belong to the invoking user with mode 0600; file preserved.',
    );
}
if (!existsSync(privatePath)) {
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 3072,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  writeFileSync(privatePath, pair.privateKey, { mode: 0o600, flag: 'wx' });
  writeFileSync(path.join(keys, 'access-public.pem'), pair.publicKey, { flag: 'wx' });
}
const envPath = path.join(root, 'infra/.env');
if (!existsSync(envPath))
  writeFileSync(
    envPath,
    'POSTGRES_USER=devpath\nPOSTGRES_DB=devpath\nPOSTGRES_PASSWORD=' +
      randomBytes(24).toString('hex') +
      '\nENGINE_SERVICE_SECRET=' +
      randomBytes(32).toString('hex') +
      '\n',
    { mode: 0o600, flag: 'wx' },
  );
const content = readFileSync(envPath, 'utf8');
const additions = [];
for (const [name, value] of [
  ['LOCAL_UID', uid],
  ['LOCAL_GID', gid],
]) {
  const entries = [...content.matchAll(new RegExp('^' + name + '=(.*)$', 'gm'))];
  if (entries.length > 1 || (entries.length === 1 && entries[0][1].trim() !== String(value)))
    throw Error(name + ' does not match the invoking user; existing configuration preserved.');
  if (!entries.length) additions.push(name + '=' + value);
}
if (additions.length) appendFileSync(envPath, '\n' + additions.join('\n') + '\n');
console.log(
  'Local keys and infra/.env ready; existing files preserved; non-root API identity configured.',
);
