import type { ErrorRequestHandler, RequestHandler } from 'express';

import { HttpError, type ErrorCode } from '../errors/http-error.js';
import type { Logger } from '../logging/logger.js';
import { getRequestId } from './request-context.js';

interface ErrorDescriptor {
  readonly code: ErrorCode;
  readonly fields?: Readonly<Record<string, readonly string[]>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly message: string;
  readonly status: number;
}

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(
    new HttpError({
      status: 404,
      code: 'INTERNAL_ERROR',
      message: 'No se encontró el recurso solicitado.',
    }),
  );
};

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, request, response, _next) => {
    void _next;
    const descriptor = describeError(error);
    const requestId = getRequestId(response);

    if (descriptor.status >= 500) {
      logger.error('HTTP request failed.', {
        requestId,
        method: request.method,
        path: request.path,
        error,
      });
    }

    if (descriptor.headers !== undefined) {
      response.set(descriptor.headers);
    }

    response.status(descriptor.status).json({
      error: {
        code: descriptor.code,
        message: descriptor.message,
        requestId,
        ...(descriptor.fields === undefined ? {} : { fields: descriptor.fields }),
      },
    });
  };
}

function describeError(error: unknown): ErrorDescriptor {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      ...(error.fields === undefined ? {} : { fields: error.fields }),
      ...(error.headers === undefined ? {} : { headers: error.headers }),
    };
  }

  if (isBodyParserError(error, 'entity.too.large')) {
    return {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'El cuerpo de la solicitud supera el límite permitido.',
    };
  }

  if (isBodyParserError(error, 'entity.parse.failed')) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'El cuerpo JSON no es válido.',
    };
  }

  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'No fue posible completar la solicitud.',
  };
}

function isBodyParserError(error: unknown, type: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: unknown }).type === type
  );
}
