import type { RequestHandler, Response } from 'express';
import { Router } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';

import { HttpError } from '../../../platform/errors/http-error.js';
import { ProfileRepository, type ProfileRow } from '../repository.js';

const name = z.string().trim().min(1).max(100);
const nullableText = (maximum: number) =>
  z.union([z.string().trim().min(1).max(maximum), z.null()]);
const updateSchema = z
  .object({
    name: name.optional(),
    headline: nullableText(160).optional(),
    location: nullableText(120).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
const skillId = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9-]*$/u);
const replaceSchema = z
  .object({
    skillIds: z
      .array(skillId)
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length),
  })
  .strict();
const listSchema = z
  .object({
    q: z.string().trim().min(1).max(80).optional(),
    cursor: z
      .string()
      .min(16)
      .max(512)
      .regex(/^[A-Za-z0-9_-]+$/u)
      .optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
const cursorSchema = z
  .object({
    v: z.literal(1),
    after: skillId,
    q: z.string().max(80).nullable(),
  })
  .strict();

function invalidInput(): HttpError {
  return new HttpError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Revisa los datos enviados.',
  });
}

function missingProfile(): HttpError {
  return new HttpError({ status: 404, code: 'NOT_FOUND', message: 'No se encontró el perfil.' });
}

function userId(response: Response): string {
  const value: unknown = response.locals.userId;
  if (typeof value !== 'string') throw new Error('Profile routes require authenticated userId.');
  return value;
}

function profileDto(row: ProfileRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    headline: row.headline,
    location: row.location,
    skillsRevision: row.skills_revision,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function readCursor(raw: string | undefined, query: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  try {
    const value = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as unknown;
    const parsed = cursorSchema.parse(value);
    if (
      Buffer.from(JSON.stringify(parsed)).toString('base64url') !== raw ||
      parsed.q !== (query ?? null)
    )
      throw invalidInput();
    return parsed.after;
  } catch {
    throw invalidInput();
  }
}

export function profileRouter(pool: Pool, authenticate: RequestHandler): Router {
  const router = Router();
  const repository = new ProfileRepository(pool);
  router.use('/me', authenticate);
  router.use('/skills', authenticate);

  router.get('/me', async (_request, response) => {
    try {
      const profile = await repository.getProfile(userId(response));
      if (profile === undefined) throw missingProfile();
      response.json(profileDto(profile));
    } catch (error) {
      throw safeError(error);
    }
  });

  router.patch('/me', async (request, response) => {
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) throw invalidInput();
    try {
      const profile = await repository.updateProfile(userId(response), parsed.data);
      if (profile === undefined) throw missingProfile();
      response.json(profileDto(profile));
    } catch (error) {
      throw safeError(error);
    }
  });

  router.get('/skills', async (request, response) => {
    const parsed = listSchema.safeParse(request.query);
    if (!parsed.success) throw invalidInput();
    const { q, cursor, limit } = parsed.data;
    const after = readCursor(cursor, q);
    try {
      const rows = await repository.listSkills(q, after, limit);
      const hasNext = rows.length > limit;
      const items = rows.slice(0, limit);
      const nextCursor = hasNext
        ? Buffer.from(
            JSON.stringify({ v: 1, after: items[items.length - 1]!.id, q: q ?? null }),
          ).toString('base64url')
        : null;
      response.json({ catalogVersion: '1.0.0', items, nextCursor });
    } catch (error) {
      throw safeError(error);
    }
  });

  router.get('/me/skills', async (_request, response) => {
    try {
      const result = await repository.getUserSkills(userId(response));
      if (result === undefined) throw missingProfile();
      response.json(result);
    } catch (error) {
      throw safeError(error);
    }
  });

  router.put('/me/skills', async (request, response) => {
    const parsed = replaceSchema.safeParse(request.body);
    if (!parsed.success) throw invalidInput();
    try {
      const result = await repository.replaceUserSkills(userId(response), parsed.data.skillIds);
      if (result === undefined) throw missingProfile();
      response.json(result);
    } catch (error) {
      throw safeError(error);
    }
  });

  return router;
}

function safeError(error: unknown): Error {
  if (error instanceof HttpError) return error;
  return new HttpError({
    status: 503,
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'No fue posible acceder a los datos del perfil.',
  });
}
