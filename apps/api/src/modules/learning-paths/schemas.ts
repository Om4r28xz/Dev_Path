import { z } from 'zod';
import { HttpError } from '../../platform/errors/http-error.js';

export const uuidSchema = z.string().uuid().toLowerCase();

export const createLearningPathSchema = z
  .object({
    analysisId: uuidSchema,
  })
  .strict();

export type CreateLearningPathInput = z.infer<typeof createLearningPathSchema>;

export const learningStepStatusSchema = z.enum(['pending', 'in_progress', 'completed']);

export const updateLearningStepSchema = z
  .object({
    status: learningStepStatusSchema,
  })
  .strict();

export type UpdateLearningStepInput = z.infer<typeof updateLearningStepSchema>;

export const learningPathListSchema = z
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

const timestampMicrosSchema = z
  .string()
  .regex(/^(?!0000)\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{6}Z$/u)
  .refine(
    (value) =>
      !Number.isNaN(new Date(value).getTime()) &&
      new Date(value).toISOString().slice(0, 19) === value.slice(0, 19),
  );

const cursorSchema = z
  .object({
    v: z.literal(1),
    owner: uuidSchema,
    createdAt: timestampMicrosSchema,
    id: uuidSchema,
  })
  .strict();

export type LearningPathCursor = z.infer<typeof cursorSchema>;

export function invalidLearningPathInput(fields?: Record<string, string[]>): HttpError {
  return new HttpError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Revisa los datos de la ruta de aprendizaje.',
    ...(fields ? { fields } : {}),
  });
}

export function parseIdempotencyKey(raw: string | undefined): string {
  const parsed = uuidSchema.safeParse(raw?.trim());
  if (!parsed.success) {
    throw invalidLearningPathInput({
      idempotencyKey: ['Idempotency-Key debe ser un UUID válido.'],
    });
  }
  return parsed.data;
}

export function encodeLearningPathCursor(owner: string, createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify(cursorSchema.parse({ v: 1, owner, createdAt, id }))).toString(
    'base64url',
  );
}

export function decodeLearningPathCursor(
  raw: string | undefined,
  owner: string,
): LearningPathCursor | undefined {
  if (raw === undefined) return undefined;
  try {
    const parsed = cursorSchema.parse(JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')));
    if (
      parsed.owner !== owner ||
      encodeLearningPathCursor(parsed.owner, parsed.createdAt, parsed.id) !== raw
    ) {
      throw invalidLearningPathInput();
    }
    return parsed;
  } catch {
    throw invalidLearningPathInput();
  }
}
