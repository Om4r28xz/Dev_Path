import { Router } from 'express';
import { HttpError } from '../../../platform/errors/http-error.js';
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
        res.cookie(localHttp ? 'devpath_refresh' : '__Secure-devpath_refresh', session.refresh, {
          httpOnly: true,
          secure: !localHttp,
          sameSite: 'lax',
          path: '/api/v1/auth',
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
  return router;
}
