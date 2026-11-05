import { Router, type RequestHandler } from 'express';
import type { Pool } from 'pg';
import { authenticatedUserId } from '../auth/http/access-token.js';
import { LearningPathsRepository, type LearningPathsRepositoryOptions } from './repository.js';
import {
  createLearningPathSchema,
  decodeLearningPathCursor,
  invalidLearningPathInput,
  learningPathListSchema,
  parseIdempotencyKey,
  updateLearningStepSchema,
  uuidSchema,
} from './schemas.js';

export function learningPathsRouter(
  pool: Pool,
  authenticate: RequestHandler,
  options?: LearningPathsRepositoryOptions,
): Router {
  const router = Router();
  const repository = new LearningPathsRepository(pool, options);

  router.use('/learning-paths', authenticate);

  router.get('/learning-paths', async (request, response) => {
    const parsed = learningPathListSchema.safeParse(request.query);
    if (!parsed.success) {
      throw invalidLearningPathInput();
    }
    const owner = authenticatedUserId(response);
    const cursor = decodeLearningPathCursor(parsed.data.cursor, owner);
    response
      .set('Cache-Control', 'no-store')
      .json(await repository.list(owner, parsed.data.limit, cursor));
  });

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

  router.get('/learning-paths/:id', async (request, response) => {
    const id = uuidSchema.safeParse(request.params.id);
    if (!id.success) {
      throw invalidLearningPathInput();
    }
    const owner = authenticatedUserId(response);
    response.set('Cache-Control', 'no-store').json(await repository.get(owner, id.data));
  });

  router.patch('/learning-paths/:id/steps/:stepId', async (request, response) => {
    const pathId = uuidSchema.safeParse(request.params.id);
    const stepId = uuidSchema.safeParse(request.params.stepId);
    const body = updateLearningStepSchema.safeParse(request.body);
    if (!pathId.success || !stepId.success || !body.success) {
      throw invalidLearningPathInput();
    }
    const owner = authenticatedUserId(response);
    const updated = await repository.updateStepStatus(
      owner,
      pathId.data,
      stepId.data,
      body.data.status,
    );
    response.set('Cache-Control', 'no-store').json(updated);
  });

  router.delete('/learning-paths/:id', async (request, response) => {
    const id = uuidSchema.safeParse(request.params.id);
    if (!id.success) {
      throw invalidLearningPathInput();
    }
    const owner = authenticatedUserId(response);
    await repository.delete(owner, id.data);
    response.set('Cache-Control', 'no-store').status(204).end();
  });

  return router;
}
