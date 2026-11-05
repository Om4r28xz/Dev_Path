import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { z } from 'zod';
import { invalidJobsQuery } from '../schemas/index.js';

const CURSOR_PREFIX = 'j1.';
const CURSOR_AAD = Buffer.from('devpath:jobs:v1', 'utf8');
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const DEFAULT_TTL_SECONDS = 15 * 60;
const FALLBACK_DEV_KEY_MATERIAL = 'devpath-local-jobs-cursor-key-v1';

const cursorPayloadSchema = z
  .object({
    v: z.literal(1),
    c: z.string().min(1).max(512),
    u: z.string().uuid(),
    h: z.string().regex(/^[0-9a-f]{64}$/u),
    p: z.number().int().min(2).max(1000),
    exp: z.number().int().positive(),
  })
  .strict();

export interface JobsCursorContext {
  readonly userId: string;
  readonly q: string;
  readonly location?: string | undefined;
  readonly mode: 'fixture' | 'live';
  readonly country?: string | undefined;
  readonly language?: string | undefined;
}

export interface DecodedJobsCursor {
  readonly upstreamCursor: string;
  readonly page: number;
}

export function resolveCursorKey(
  rawSecret: string | undefined,
  environment: 'development' | 'test' | 'production' = 'development',
): Buffer {
  const trimmed = rawSecret?.trim();
  if (!trimmed) {
    if (environment === 'production') {
      throw new Error('JOBS_CURSOR_KEY is required in production.');
    }
    return createHash('sha256').update(FALLBACK_DEV_KEY_MATERIAL, 'utf8').digest();
  }
  if (/^[0-9a-fA-F]{64}$/u.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }
  const base64Decoded = Buffer.from(trimmed, 'base64url');
  if (base64Decoded.byteLength === 32) {
    return base64Decoded;
  }
  if (Buffer.byteLength(trimmed, 'utf8') >= 32) {
    return createHash('sha256').update(trimmed, 'utf8').digest();
  }
  throw new Error('JOBS_CURSOR_KEY must provide at least 32 bytes of key material.');
}

export function hashJobsQueryContext(context: JobsCursorContext): string {
  const normalized = JSON.stringify({
    q: context.q.trim().toLowerCase(),
    location: context.location ? context.location.trim().toLowerCase() : null,
    mode: context.mode,
    country: (context.country ?? 'mx').trim().toLowerCase(),
    language: (context.language ?? 'es').trim().toLowerCase(),
  });
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function encodeJobsCursor(options: {
  readonly upstreamCursor: string;
  readonly page: number;
  readonly context: JobsCursorContext;
  readonly key: Buffer;
  readonly nowMs?: number;
  readonly ttlSeconds?: number;
}): string {
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);
  const ttl = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const payload = {
    v: 1 as const,
    c: options.upstreamCursor,
    u: options.context.userId,
    h: hashJobsQueryContext(options.context),
    p: options.page,
    exp: nowSeconds + ttl,
  };
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv('aes-256-gcm', options.key, nonce);
  cipher.setAAD(CURSOR_AAD);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const packed = Buffer.concat([nonce, ciphertext, tag]).toString('base64url');
  return `${CURSOR_PREFIX}${packed}`;
}

function safeEqualStrings(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left, 'utf8');
  const rightBuf = Buffer.from(right, 'utf8');
  if (leftBuf.byteLength !== rightBuf.byteLength) return false;
  return timingSafeEqual(leftBuf, rightBuf);
}

export function decodeJobsCursor(options: {
  readonly token: string;
  readonly context: JobsCursorContext;
  readonly key: Buffer;
  readonly nowMs?: number;
}): DecodedJobsCursor {
  const { token, context, key } = options;
  if (
    token.length < 16 ||
    token.length > 2048 ||
    !token.startsWith(CURSOR_PREFIX) ||
    !/^j1\.[A-Za-z0-9_-]+$/u.test(token)
  ) {
    throw invalidCursor();
  }

  let raw: Buffer;
  try {
    raw = Buffer.from(token.slice(CURSOR_PREFIX.length), 'base64url');
  } catch {
    throw invalidCursor();
  }

  if (raw.byteLength < NONCE_BYTES + TAG_BYTES + 2) {
    throw invalidCursor();
  }

  const nonce = raw.subarray(0, NONCE_BYTES);
  const tag = raw.subarray(raw.byteLength - TAG_BYTES);
  const ciphertext = raw.subarray(NONCE_BYTES, raw.byteLength - TAG_BYTES);

  let decrypted: string;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAAD(CURSOR_AAD);
    decipher.setAuthTag(tag);
    decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw invalidCursor();
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(decrypted);
  } catch {
    throw invalidCursor();
  }

  const parsed = cursorPayloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw invalidCursor();
  }

  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);
  const expectedHash = hashJobsQueryContext(context);
  const userMatches = safeEqualStrings(parsed.data.u, context.userId);
  const hashMatches = safeEqualStrings(parsed.data.h, expectedHash);
  if (!userMatches || !hashMatches || parsed.data.exp <= nowSeconds) {
    throw invalidCursor();
  }

  return {
    upstreamCursor: parsed.data.c,
    page: parsed.data.p,
  };
}

function invalidCursor() {
  return invalidJobsQuery({
    cursor: ['El cursor de paginación es inválido, expiró o no corresponde a esta consulta.'],
  });
}
