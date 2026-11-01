import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import { HttpError } from '../../platform/errors/http-error.js';
import { getRequestId } from '../../platform/http/request-context.js';
import { authenticatedUserId } from '../auth/http/access-token.js';
import type { AnalysisEngine } from './engine-client.js';
import { AnalysesRepository } from './repository.js';
import { createAnalysisSchema } from './schemas.js';
export function analysesRouter(
  pool: Pool,
  authenticate: RequestHandler,
  engine: AnalysisEngine,
): Router {
  const router = Router();
  const repository = new AnalysesRepository(pool, engine);
  router.post('/analyses', authenticate, async (request, response) => {
    const parsed = createAnalysisSchema.safeParse(request.body);
    const key = z.string().uuid().safeParse(request.get('Idempotency-Key'));
    if (!parsed.success || !key.success)
      throw new HttpError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Envía una vacante válida y una clave de idempotencia UUID.',
      });
    const result = await repository.create(
      authenticatedUserId(response),
      key.data.toLowerCase(),
      parsed.data,
      getRequestId(response),
    );
    response
      .set('Cache-Control', 'no-store')
      .status(result.created ? 201 : 200)
      .json(result.analysis);
  });
  return router;
}
