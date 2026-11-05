import { Router, type RequestHandler } from 'express';
import type { Pool } from 'pg';
import { authenticatedUserId } from '../auth/http/access-token.js';
import { LearningPathsRepository, type LearningPathsRepositoryOptions } from './repository.js';
import {
  createLearningPathSchema,
  invalidLearningPathInput,
  parseIdempotencyKey,
} from './schemas.js';

export function learningPathsRouter(
  pool: Pool,
  authenticate: RequestHandler,
  options?: LearningPathsRepositoryOptions,
): Router {
  const router = Router();
  const repository = new LearningPathsRepository(pool, options);

  router.use('/learning-paths', authenticate);

  router.post('/learning-paths', async (request, response) => {
    const idempotencyKey = parseIdempotencyKey(request.get('Idempotency-Key'));
    const parsed = createLearningPathSchema.safeParse(request.body);
    if (!parsed.success) {
      throw invalidLearningPathInput();
    }
    const owner = authenticatedUserId(response);
    const result = await repository.create(owner, idempotencyKey, parsed.data.analysisId);
    response.set('Cache-Control', 'no-store');
    if (result.status === 201) {
      response.location(`/api/v1/learning-paths/${result.body.id}`);
    }
    response.status(result.status).json(result.body);
  });

  return router;
}
