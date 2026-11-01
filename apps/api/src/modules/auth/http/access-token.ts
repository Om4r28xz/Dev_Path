import type { RequestHandler, Response } from 'express';

import { HttpError } from '../../../platform/errors/http-error.js';
import type { AuthService } from '../services/auth-service.js';

export function accessTokenMiddleware(service: AuthService): RequestHandler {
  return async (request, response, next) => {
    const header = request.get('Authorization');
    const match = /^Bearer ([A-Za-z0-9._-]+)$/u.exec(header ?? '');
    if (match === null) {
      next(
        new HttpError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'Token de acceso ausente o inválido.',
        }),
      );
      return;
    }
    try {
      response.locals.userId = await service.verifyAccessToken(match[1]!);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authenticatedUserId(response: Response): string {
  const userId: unknown = response.locals.userId;
  if (typeof userId !== 'string')
    throw new Error('Authenticated route requires accessTokenMiddleware.');
  return userId;
}
