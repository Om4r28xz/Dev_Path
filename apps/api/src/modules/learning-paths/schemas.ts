import { z } from 'zod';
import { HttpError } from '../../platform/errors/http-error.js';

export const uuidSchema = z.string().uuid().toLowerCase();

export const createLearningPathSchema = z
  .object({
    analysisId: uuidSchema,
  })
  .strict();

export type CreateLearningPathInput = z.infer<typeof createLearningPathSchema>;

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
