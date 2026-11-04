import { Router, type RequestHandler } from 'express';
import { authenticatedUserId } from '../auth/http/access-token.js';
import type { CvService } from './service.js';
import { receiveCv } from './upload.js';

export function cvRouter(service: CvService, authenticate: RequestHandler): Router {
  const router = Router();
  router.use('/me/cv', authenticate);
  router.get('/me/cv', async (_request, response) => {
    response
      .set('Cache-Control', 'no-store')
      .json(await service.metadata(authenticatedUserId(response)));
  });
  router.put('/me/cv', async (request, response) => {
    const upload = await receiveCv(request, service.storage);
    const result = await service.replace(authenticatedUserId(response), upload);
    response
      .set('Cache-Control', 'no-store')
      .set('X-File-Cleanup-Pending', String(result.cleanupPending))
      .json(result.metadata);
  });
  router.get('/me/cv/download', async (_request, response) => {
    const stream = await service.download(authenticatedUserId(response));
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cv.pdf"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  });
  router.delete('/me/cv', async (_request, response) => {
    const pending = await service.delete(authenticatedUserId(response));
    response
      .set('Cache-Control', 'no-store')
      .set('X-File-Cleanup-Pending', String(pending))
      .status(204)
      .end();
  });
  return router;
}
