import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createPrivateKey } from 'node:crypto';
import * as argon2 from 'argon2';
import { importPKCS8, SignJWT } from 'jose';
import type { Pool } from 'pg';
import { HttpError } from '../../../platform/errors/http-error.js';
import { AuthRepository } from '../repositories/auth-repository.js';

export const PASSWORD_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
};
export interface AuthSettings {
  privateKeyFile: string;
  localHttp: boolean;
}
export async function createAuthService(pool: Pool, settings: AuthSettings) {
  const pem = await readFile(settings.privateKeyFile, 'utf8');
  const parsed = createPrivateKey(pem);
  if (
    parsed.asymmetricKeyType !== 'rsa' ||
    (parsed.asymmetricKeyDetails?.modulusLength ?? 0) < 2048
  )
    throw new Error('Auth requires RSA >=2048 bits.');
  const key = await importPKCS8(pem, 'RS256');
  const repository = new AuthRepository(pool);
  // The missing-account path also pays a real password verification cost.
  const dummyHash = await argon2.hash(randomBytes(32).toString('hex'), PASSWORD_OPTIONS);
  async function session(user: { id: string; name: string; email: string }) {
    const now = Math.floor(Date.now() / 1000);
    const refresh = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(refresh).digest('hex');
    const expiresAt = new Date((now + 604800) * 1000);
    const accessToken = await new SignJWT({ role: 'candidate' })
      .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt' })
      .setSubject(user.id)
      .setIssuer('urn:devpath:auth')
      .setAudience('devpath-api')
      .setIssuedAt(now)
      .setExpirationTime(now + 900)
      .setJti(randomUUID())
      .sign(key);
    return {
      tokenHash,
      expiresAt,
      refresh,
      body: {
        accessToken,
        tokenType: 'Bearer' as const,
        expiresIn: 900 as const,
        user: { id: user.id, name: user.name, email: user.email },
      },
    };
  }
  return {
    async register(input: { name: string; email: string; password: string }) {
      const hash = await argon2.hash(input.password, PASSWORD_OPTIONS);
      try {
        return await repository.transaction(async (client) => {
          const user = await repository.insertAccount(client, input.name, input.email, hash);
          const result = await session(user);
          await repository.insertSession(client, user.id, result.tokenHash, result.expiresAt);
          return result;
        });
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === '23505' &&
          'constraint' in error &&
          ['users_email_unique', 'users_email_idx'].includes(String(error.constraint))
        ) {
          throw new HttpError({
            status: 409,
            code: 'EMAIL_ALREADY_REGISTERED',
            message: 'El email ya está registrado.',
          });
        }
        throw error;
      }
    },
    async login(input: { email: string; password: string }) {
      const user = await repository.find(input.email);
      const valid = await argon2.verify(user?.password_hash ?? dummyHash, input.password);
      if (!user || !valid)
        throw new HttpError({
          status: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Credenciales inválidas.',
        });
      return repository.transaction(async (client) => {
        const result = await session(user);
        await repository.insertSession(client, user.id, result.tokenHash, result.expiresAt);
        return result;
      });
    },
  };
}
export type AuthService = Awaited<ReturnType<typeof createAuthService>>;
