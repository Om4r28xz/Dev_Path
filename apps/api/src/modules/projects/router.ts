import { Router, type RequestHandler } from 'express';
import type { Pool } from 'pg';
import { authenticatedUserId } from '../auth/http/access-token.js';
import { ProjectsRepository } from './repository.js';
import {
  createProjectSchema,
  decodeProjectCursor,
  invalidProjectInput,
  projectIdSchema,
  projectListSchema,
  updateProjectSchema,
} from './validation.js';

export function projectsRouter(pool: Pool, authenticate: RequestHandler): Router {
  const router = Router();
  const repository = new ProjectsRepository(pool);
  router.use('/projects', authenticate);
  router.get('/projects', async (request, response) => {
    const parsed = projectListSchema.safeParse(request.query);
    if (!parsed.success) throw invalidProjectInput();
    const owner = authenticatedUserId(response);
    const cursor = decodeProjectCursor(parsed.data.cursor, owner);
    response
      .set('Cache-Control', 'no-store')
      .json(await repository.list(owner, parsed.data.limit, cursor));
  });
  router.post('/projects', async (request, response) => {
    const parsed = createProjectSchema.safeParse(request.body);
    if (!parsed.success) throw invalidProjectInput();
    const project = await repository.create(authenticatedUserId(response), parsed.data);
    response
      .set('Cache-Control', 'no-store')
      .location('/api/v1/projects/' + project.id)
      .status(201)
      .json(project);
  });
  router.get('/projects/:id', async (request, response) => {
    const id = projectIdSchema.safeParse(request.params.id);
    if (!id.success) throw invalidProjectInput();
    response
      .set('Cache-Control', 'no-store')
      .json(await repository.get(authenticatedUserId(response), id.data));
  });
  router.patch('/projects/:id', async (request, response) => {
    const id = projectIdSchema.safeParse(request.params.id);
    const parsed = updateProjectSchema.safeParse(request.body);
    if (!id.success || !parsed.success) throw invalidProjectInput();
    response
      .set('Cache-Control', 'no-store')
      .json(await repository.update(authenticatedUserId(response), id.data, parsed.data));
  });
  router.delete('/projects/:id', async (request, response) => {
    const id = projectIdSchema.safeParse(request.params.id);
    if (!id.success) throw invalidProjectInput();
    await repository.delete(authenticatedUserId(response), id.data);
    response.set('Cache-Control', 'no-store').status(204).end();
  });
  return router;
}
