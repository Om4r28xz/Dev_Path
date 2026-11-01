import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import { HttpError } from '../../platform/errors/http-error.js';
import { getRequestId } from '../../platform/http/request-context.js';
import { authenticatedUserId } from '../auth/http/access-token.js';
import type { AnalysisEngine } from './engine-client.js';
import { AnalysesRepository } from './repository.js';
import { createAnalysisSchema } from './schemas.js';
import { AnalysisHistoryRepository } from './history-repository.js';
import {
  analysisIdSchema,
  decodeHistoryCursor,
  historyQuerySchema,
  invalidHistoryInput,
} from './history-cursor.js';
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

  const history = new AnalysisHistoryRepository(pool);
  router.get('/analyses', authenticate, async (request, response) => {
    const parsed = historyQuerySchema.safeParse(request.query);
    if (!parsed.success) throw invalidHistoryInput();
    const owner = authenticatedUserId(response);
    const cursor = decodeHistoryCursor(parsed.data.cursor, owner);
    response
      .set('Cache-Control', 'no-store')
      .json(await history.list(owner, parsed.data.limit, cursor));
  });
  router.get('/analyses/:analysisId', authenticate, async (request, response) => {
    const id = analysisIdSchema.safeParse(request.params.analysisId);
    if (!id.success) throw invalidHistoryInput();
    response
      .set('Cache-Control', 'no-store')
      .json(await history.detail(authenticatedUserId(response), id.data));
  });
  router.delete('/analyses/:analysisId', authenticate, async (request, response) => {
    const id = analysisIdSchema.safeParse(request.params.analysisId);
    if (!id.success) throw invalidHistoryInput();
    await history.delete(authenticatedUserId(response), id.data);
    response.set('Cache-Control', 'no-store').status(204).end();
  });
  return router;
}
