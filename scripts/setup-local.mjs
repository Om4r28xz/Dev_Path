import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keys = path.join(root, '.local-data/keys');
mkdirSync(keys, { recursive: true });
const privatePath = path.join(keys, 'access-private.pem');
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
console.log('Local keys and infra/.env ready; existing files preserved.');
