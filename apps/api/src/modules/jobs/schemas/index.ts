import { z } from 'zod';
import { HttpError } from '../../../platform/errors/http-error.js';

const FORBIDDEN_URL_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//iu;

export const jobsSearchQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(1, 'Ingresa un término de búsqueda entre 1 y 80 caracteres.')
      .max(80, 'Ingresa un término de búsqueda entre 1 y 80 caracteres.'),
    location: z
      .string()
      .trim()
      .min(1, 'La ubicación debe tener entre 1 y 120 caracteres.')
      .max(120, 'La ubicación debe tener entre 1 y 120 caracteres.')
      .optional(),
    page: z
      .string()
      .trim()
      .regex(/^\d+$/u, 'El parámetro page solo admite el valor 1; usa cursor para paginar.')
      .transform((value) => Number(value))
      .refine((value) => value === 1, {
        message: 'Solo se admite page=1; usa nextCursor en el parámetro cursor para continuar.',
      })
      .optional(),
    cursor: z
      .string()
      .min(16, 'El cursor de paginación es inválido.')
      .max(2048, 'El cursor de paginación es inválido.')
      .regex(/^j1\.[A-Za-z0-9_-]+$/u, 'El cursor de paginación es inválido.')
      .optional(),
  })
  .strict();

export type JobsSearchQuery = z.infer<typeof jobsSearchQuerySchema>;

export const jobDetailsQuerySchema = z
  .object({
    providerId: z
      .string()
      .trim()
      .min(1, 'El identificador de vacante es obligatorio.')
      .max(512, 'El identificador de vacante excede el límite.')
      .regex(/^[^\r\n]+$/u, 'El identificador de vacante es inválido.')
      .refine((value) => !FORBIDDEN_URL_PREFIX.test(value), {
        message: 'No se aceptan URLs como providerId.',
      }),
  })
  .strict();

export type JobDetailsQuery = z.infer<typeof jobDetailsQuerySchema>;

export function invalidJobsQuery(fields?: Readonly<Record<string, readonly string[]>>): HttpError {
  return new HttpError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Los parámetros de consulta de vacantes no son válidos.',
    ...(fields ? { fields } : {}),
  });
}
