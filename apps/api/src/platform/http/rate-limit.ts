import type { RequestHandler } from 'express';

import { HttpError } from '../errors/http-error.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  readonly maxRequests: number;
  readonly now?: () => number;
  readonly windowMs: number;
}

export function createRateLimitMiddleware(options: RateLimitOptions): RequestHandler {
  const entries = new Map<string, RateLimitEntry>();
  const now = options.now ?? Date.now;
  let nextSweepAt = 0;

  return (request, response, next) => {
    const currentTime = now();

    if (currentTime >= nextSweepAt) {
      for (const [key, entry] of entries) {
        if (entry.resetAt <= currentTime) {
          entries.delete(key);
        }
      }
      nextSweepAt = currentTime + options.windowMs;
    }

    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const existingEntry = entries.get(key);
    const entry =
      existingEntry === undefined || existingEntry.resetAt <= currentTime
        ? { count: 0, resetAt: currentTime + options.windowMs }
        : existingEntry;

    entry.count += 1;
    entries.set(key, entry);

    const remaining = Math.max(0, options.maxRequests - entry.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000));

    response.set({
      'RateLimit-Limit': String(options.maxRequests),
      'RateLimit-Remaining': String(remaining),
      'RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
    });

    if (entry.count > options.maxRequests) {
      next(
        new HttpError({
          status: 429,
          code: 'RATE_LIMITED',
          message: 'Se alcanzó el límite local de solicitudes. Inténtalo de nuevo más tarde.',
          headers: { 'Retry-After': String(retryAfterSeconds) },
        }),
      );
      return;
    }

    next();
  };
}
