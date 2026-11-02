import { z } from 'zod';
import { HttpError } from '../../platform/errors/http-error.js';
const uuid = z.string().uuid().toLowerCase();
const timestamp = z
  .string()
  .regex(/^(?!0000)\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{6}Z$/u)
  .refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 19) === value.slice(0, 19);
  });
const cursorSchema = z
  .object({ v: z.literal(1), owner: uuid, createdAt: timestamp, id: uuid })
  .strict();
export type HistoryCursor = z.infer<typeof cursorSchema>;
export const historyQuerySchema = z
  .object({
    limit: z
      .string()
      .regex(/^[1-9]\d*$/u)
      .transform(Number)
      .pipe(z.number().int().min(1).max(50))
      .default('20'),
    cursor: z
      .string()
      .min(16)
      .max(512)
      .regex(/^[A-Za-z0-9_-]+$/u)
      .optional(),
  })
  .strict();
export const analysisIdSchema = uuid;
export function invalidHistoryInput(): HttpError {
  return new HttpError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Revisa el identificador, el límite o el cursor enviado.',
  });
}
export function encodeHistoryCursor(owner: string, createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify(cursorSchema.parse({ v: 1, owner, createdAt, id }))).toString(
    'base64url',
  );
}
export function decodeHistoryCursor(
  raw: string | undefined,
  owner: string,
): HistoryCursor | undefined {
  if (raw === undefined) return undefined;
  try {
    if (raw.length < 16 || raw.length > 512 || !/^[A-Za-z0-9_-]+$/u.test(raw))
      throw invalidHistoryInput();
    const value = cursorSchema.parse(JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')));
    if (
      value.owner !== owner ||
      encodeHistoryCursor(value.owner, value.createdAt, value.id) !== raw
    )
      throw invalidHistoryInput();
    return value;
  } catch {
    throw invalidHistoryInput();
  }
}
