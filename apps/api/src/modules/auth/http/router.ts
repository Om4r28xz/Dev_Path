import { Router } from 'express';
import { HttpError } from '../../../platform/errors/http-error.js';
import { createRateLimitMiddleware } from '../../../platform/http/rate-limit.js';
import { loginSchema, registerSchema } from '../schemas/commands.js';
import type { AuthService } from '../services/auth-service.js';
export function authRouter(
  service: AuthService,
  origins: readonly string[],
  localHttp: boolean,
): Router {
  if (
    localHttp &&
    origins.some((origin) => {
      const url = new URL(origin);
      return (
        url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      );
    })
  )
    throw new Error('AUTH_LOCAL_HTTP only accepts explicit HTTP loopback origins.');
  const router = Router();
  const cookieName = localHttp ? 'devpath_refresh' : '__Secure-devpath_refresh';
  const cookieOptions = {
    httpOnly: true,
    secure: !localHttp,
    sameSite: 'lax' as const,
    path: '/api/v1/auth',
  };
  router.use(createRateLimitMiddleware({ maxRequests: 60, windowMs: 60_000 }));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!req.is('application/json'))
      return next(
        new HttpError({
          status: 415,
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Se requiere application/json.',
        }),
      );
    let origin = req.get('origin');
    if (!origin && req.get('referer')) {
      try {
        origin = new URL(req.get('referer')!).origin;
      } catch {
        origin = undefined;
      }
    }
    if (!origin || !origins.includes(origin) || req.get('X-DevPath-Client') !== 'web')
      return next(
        new HttpError({
          status: 403,
          code: 'FORBIDDEN',
          message: 'Origen o cliente no permitido.',
        }),
      );
    next();
  });
  for (const action of ['register', 'login'] as const) {
    router.post('/' + action, async (req, res) => {
      const result = (action === 'register' ? registerSchema : loginSchema).safeParse(req.body);
      if (!result.success)
        throw new HttpError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Revisa los datos enviados.',
        });
      try {
        const session =
          action === 'register'
            ? await service.register(registerSchema.parse(result.data))
            : await service.login(loginSchema.parse(result.data));
        res.set('Cache-Control', 'no-store');
        res.cookie(cookieName, session.refresh, {
          ...cookieOptions,
          maxAge: Math.max(0, session.expiresAt.getTime() - Date.now()),
        });
        res.status(action === 'register' ? 201 : 200).json(session.body);
      } catch (error) {
        if (error instanceof HttpError) throw error;
        // Driver errors can contain SQL parameters; never pass them to HTTP logging.
        throw new HttpError({
          status: 503,
          code: 'DEPENDENCY_UNAVAILABLE',
          message: 'No fue posible acceder al servicio de autenticación.',
        });
      }
    });
  }
  router.post('/refresh', async (req, res) => {
    const raw = readRefreshCookie(req.get('cookie'), cookieName);
    if (raw === undefined)
      throw new HttpError({
        status: 401,
        code: 'UNAUTHENTICATED',
        message: 'Sesión inválida o expirada.',
      });
    try {
      const session = await service.refresh(raw);
      res.cookie(cookieName, session.refresh, {
        ...cookieOptions,
        maxAge: Math.max(0, session.expiresAt.getTime() - Date.now()),
      });
      res.status(200).json(session.body);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError({
        status: 503,
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'No fue posible acceder al servicio de autenticación.',
      });
    }
  });
  router.post('/logout', async (req, res) => {
    const raw = readRefreshCookie(req.get('cookie'), cookieName);
    try {
      await service.logout(raw);
      res.cookie(cookieName, '', { ...cookieOptions, maxAge: 0 });
      res.status(204).end();
    } catch {
      throw new HttpError({
        status: 503,
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'No fue posible revocar la sesión.',
      });
    }
  });
  return router;
}

function readRefreshCookie(header: string | undefined, name: string): string | undefined {
  if (header === undefined) return undefined;
  const values = header.split(';').map((part) => part.trim());
  const matches = values.filter((part) => part.startsWith(`${name}=`));
  if (matches.length !== 1) return undefined;
  const value = matches[0]!.slice(name.length + 1);
  return /^[A-Za-z0-9_-]{43}$/u.test(value) ? value : undefined;
}
