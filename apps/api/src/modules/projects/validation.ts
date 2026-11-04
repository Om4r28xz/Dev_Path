import { z } from 'zod';
import { HttpError } from '../../platform/errors/http-error.js';

const skillId = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9-]*$/u);
const skillIds = z
  .array(skillId)
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length);
const nonBlank = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => /\S/u.test(value));
const projectUrl = z.union([
  z.null(),
  z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
      const containsUnsafeCharacter = [...value].some((character) => {
        const codePoint = character.codePointAt(0);
        return codePoint !== undefined && (codePoint <= 0x20 || codePoint === 0x7f);
      });
      if (!/^https?:\/\//u.test(value) || containsUnsafeCharacter) return false;
      try {
        const parsed = new URL(value);
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !!parsed.hostname;
      } catch {
        return false;
      }
    }),
]);
const fields = {
  title: nonBlank(120),
  description: nonBlank(5000),
  url: projectUrl,
  skillIds,
};
export const createProjectSchema = z
  .object({
    title: fields.title,
    description: fields.description,
    url: fields.url.optional(),
    skillIds: fields.skillIds,
  })
  .strict();
export const updateProjectSchema = z
  .object({
    title: fields.title.optional(),
    description: fields.description.optional(),
    url: fields.url.optional(),
    skillIds: fields.skillIds.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
export type ProjectUpdate = z.infer<typeof updateProjectSchema>;
export type ProjectCreate = z.infer<typeof createProjectSchema>;
export const projectIdSchema = z.string().uuid().toLowerCase();
export const projectListSchema = z
  .object({
    limit: z
      .string()
      .regex(/^[1-9]\d*$/u)
      .transform(Number)
      .pipe(z.number().int().min(1).max(50))
      .prefault('20'),
    cursor: z
      .string()
      .min(16)
      .max(512)
      .regex(/^[A-Za-z0-9_-]+$/u)
      .optional(),
  })
  .strict();
const timestamp = z
  .string()
  .regex(/^(?!0000)\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{6}Z$/u)
  .refine(
    (value) =>
      !Number.isNaN(new Date(value).getTime()) &&
      new Date(value).toISOString().slice(0, 19) === value.slice(0, 19),
  );
const cursorSchema = z
  .object({ v: z.literal(1), owner: projectIdSchema, createdAt: timestamp, id: projectIdSchema })
  .strict();
export type ProjectCursor = z.infer<typeof cursorSchema>;
export function invalidProjectInput(): HttpError {
  return new HttpError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Revisa los datos del proyecto.',
  });
}
export function encodeProjectCursor(owner: string, createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify(cursorSchema.parse({ v: 1, owner, createdAt, id }))).toString(
    'base64url',
  );
}
export function decodeProjectCursor(
  raw: string | undefined,
  owner: string,
): ProjectCursor | undefined {
  if (raw === undefined) return undefined;
  try {
    const value = cursorSchema.parse(JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')));
    if (
      value.owner !== owner ||
      encodeProjectCursor(value.owner, value.createdAt, value.id) !== raw
    )
      throw invalidProjectInput();
    return value;
  } catch {
    throw invalidProjectInput();
  }
}
