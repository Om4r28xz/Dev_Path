import { Router, type RequestHandler } from 'express';
import { authenticatedUserId } from '../../auth/http/access-token.js';
import {
  invalidJobsQuery,
  jobDetailsQuerySchema,
  jobsSearchQuerySchema,
} from '../schemas/index.js';
import {
  decodeJobsCursor,
  encodeJobsCursor,
  resolveCursorKey,
  type JobsCursorContext,
} from '../services/cursor.js';
import type { JobsProvider } from '../services/provider.js';

export interface JobsRouterOptions {
  readonly cursorKey?: Buffer | undefined;
}

export function jobsRouter(
  provider: JobsProvider,
  authenticate: RequestHandler,
  options?: JobsRouterOptions,
): Router {
  const router = Router();
  const cursorKey = options?.cursorKey ?? resolveCursorKey(process.env.JOBS_CURSOR_KEY);

  router.get('/jobs', authenticate, async (request, response) => {
    const parsed = jobsSearchQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'query');
        fieldErrors[key] ??= [];
        fieldErrors[key].push(issue.message);
      }
      throw invalidJobsQuery(fieldErrors);
    }

    const userId = authenticatedUserId(response);
    const context: JobsCursorContext = {
      userId,
      q: parsed.data.q,
      location: parsed.data.location,
      mode: provider.mode,
      country: provider.country,
      language: provider.language,
    };

    let upstreamCursor: string | undefined;
    let currentPage = 1;

    if (parsed.data.cursor) {
      const decoded = decodeJobsCursor({
        token: parsed.data.cursor,
        context,
        key: cursorKey,
      });
      upstreamCursor = decoded.upstreamCursor;
      currentPage = decoded.page;
    }

    const searchResult = await provider.search({
      q: parsed.data.q,
      location: parsed.data.location,
      upstreamCursor,
    });

    const nextCursor = searchResult.upstreamNextCursor
      ? encodeJobsCursor({
          upstreamCursor: searchResult.upstreamNextCursor,
          page: currentPage + 1,
          context,
          key: cursorKey,
        })
      : null;

    response.set('Cache-Control', 'no-store').json({
      items: searchResult.items,
      page: currentPage,
      hasNextPage: nextCursor !== null,
      nextCursor,
      mode: searchResult.mode,
    });
  });

  router.get('/jobs/details', authenticate, async (request, response) => {
    const parsed = jobDetailsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'providerId');
        fieldErrors[key] ??= [];
        fieldErrors[key].push(issue.message);
      }
      throw invalidJobsQuery(fieldErrors);
    }

    const result = await provider.details({
      providerId: parsed.data.providerId,
    });

    response.set('Cache-Control', 'no-store').json({
      job: result.job,
      mode: result.mode,
    });
  });

  return router;
}
