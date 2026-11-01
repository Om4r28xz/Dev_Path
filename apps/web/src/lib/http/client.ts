import { browserSession } from '../session/session.js';
import { ApiError, requestJson } from './transport.js';

export { ApiError } from './transport.js';

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = browserSession.snapshot().session?.accessToken;
  if (!token) {
    const session = await browserSession.bootstrap();
    token = session?.accessToken;
  }
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Inicia sesión.', '');
  const send = (accessToken: string) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return requestJson<T>(path, { ...init, headers });
  };
  try {
    return await send(token);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      error.code !== 'UNAUTHENTICATED' ||
      init.signal?.aborted
    )
      throw error;
    const session = await browserSession.refreshAfterUnauthorized(token);
    if (!session) throw error;
    return send(session.accessToken);
  }
}

export async function authRequest<T>(action: 'login' | 'register', body: unknown): Promise<T> {
  return requestJson<T>(`/api/v1/auth/${action}`, {
    method: 'POST',
    headers: { 'X-DevPath-Client': 'web' },
    body: JSON.stringify(body),
  });
}
