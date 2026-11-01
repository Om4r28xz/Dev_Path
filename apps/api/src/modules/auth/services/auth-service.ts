import { createHash, createPublicKey, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createPrivateKey } from 'node:crypto';
import * as argon2 from 'argon2';
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose';
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
const INVALID_REFRESH = new HttpError({
  status: 401,
  code: 'UNAUTHENTICATED',
  message: 'Sesión inválida o expirada.',
});
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
function refreshHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
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
  const publicPem = createPublicKey(parsed).export({ type: 'spki', format: 'pem' }).toString();
  const publicKey = await importSPKI(publicPem, 'RS256');
  const repository = new AuthRepository(pool);
  // The missing-account path also pays a real password verification cost.
  const dummyHash = await argon2.hash(randomBytes(32).toString('hex'), PASSWORD_OPTIONS);
  async function session(user: { id: string; name: string; email: string }, absoluteExpiry?: Date) {
    const now = Math.floor(Date.now() / 1000);
    const refresh = randomBytes(32).toString('base64url');
    const tokenHash = refreshHash(refresh);
    const expiresAt = absoluteExpiry ?? new Date((now + 604800) * 1000);
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
    async refresh(rawToken: string) {
      const tokenHash = refreshHash(rawToken);
      const outcome = await repository.transaction(async (client) => {
        const token = await repository.lockRefresh(client, tokenHash);
        if (token === undefined || token.revokedAt !== null) return undefined;
        if (token.usedAt !== null) {
          await repository.revokeFamily(client, token.familyId);
          return undefined;
        }
        if (token.expiresAt.getTime() <= Date.now()) return undefined;
        const result = await session(
          { id: token.userId, email: token.email, name: token.name },
          token.expiresAt,
        );
        await repository.rotateRefresh(client, token, result.tokenHash);
        return result;
      });
      if (outcome === undefined) throw INVALID_REFRESH;
      return outcome;
    },
    async logout(rawToken: string | undefined) {
      await repository.transaction(async (client) => {
        if (rawToken === undefined) {
          await client.query('SELECT 1');
          return;
        }
        const token = await repository.lockRefresh(client, refreshHash(rawToken));
        if (token !== undefined) await repository.revokeFamily(client, token.familyId);
      });
    },
    async verifyAccessToken(rawToken: string): Promise<string> {
      try {
        const result = await jwtVerify(rawToken, publicKey, {
          algorithms: ['RS256'],
          issuer: 'urn:devpath:auth',
          audience: 'devpath-api',
        });
        const { payload, protectedHeader } = result;
        if (
          protectedHeader.typ !== 'at+jwt' ||
          payload.role !== 'candidate' ||
          typeof payload.sub !== 'string' ||
          !UUID_PATTERN.test(payload.sub) ||
          typeof payload.iat !== 'number' ||
          typeof payload.exp !== 'number' ||
          typeof payload.jti !== 'string' ||
          !UUID_PATTERN.test(payload.jti)
        )
          throw INVALID_REFRESH;
        return payload.sub;
      } catch {
        throw new HttpError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'Token de acceso inválido o expirado.',
        });
      }
    },
  };
}
export type AuthService = Awaited<ReturnType<typeof createAuthService>>;
