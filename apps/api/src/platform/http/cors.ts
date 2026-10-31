import type { RequestHandler } from 'express';

import { HttpError } from '../errors/http-error.js';

const ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'Idempotency-Key',
  'X-DevPath-Client',
  'X-Request-Id',
].join(', ');

export function createCorsMiddleware(allowedOrigins: readonly string[]): RequestHandler {
  const origins = new Set(allowedOrigins);

  return (request, response, next) => {
    const origin = request.get('origin');

    response.vary('Origin');

    if (origin === undefined) {
      next();
      return;
    }

    if (!origins.has(origin)) {
      next(
        new HttpError({
          status: 403,
          code: 'FORBIDDEN',
          message: 'El origen de la solicitud no está permitido.',
        }),
      );
      return;
    }

    response.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Expose-Headers': 'X-Request-Id',
    });

    if (request.method === 'OPTIONS') {
      response.set({
        'Access-Control-Allow-Headers': ALLOWED_HEADERS,
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Max-Age': '600',
      });
      response.status(204).end();
      return;
    }

    next();
  };
}
