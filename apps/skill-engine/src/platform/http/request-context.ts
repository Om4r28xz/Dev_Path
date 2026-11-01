import { randomUUID } from 'node:crypto';

import type { RequestHandler, Response } from 'express';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export const requestContext: RequestHandler = (request, response, next) => {
  const incomingRequestId = request.get('x-request-id');
  const requestId =
    incomingRequestId !== undefined && UUID_PATTERN.test(incomingRequestId)
      ? incomingRequestId.toLowerCase()
      : randomUUID();

  response.locals.requestId = requestId;
  response.set('X-Request-Id', requestId);
  next();
};

export function getRequestId(response: Response): string {
  const requestId: unknown = response.locals.requestId;
  return typeof requestId === 'string' ? requestId : randomUUID();
}
