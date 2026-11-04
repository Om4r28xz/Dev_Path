import { browserSession } from '../session/session.js';
import { ApiError, requestResponse } from './transport.js';

export { ApiError } from './transport.js';

export async function apiResponse(path: string, init: RequestInit = {}): Promise<Response> {
  let token = browserSession.snapshot().session?.accessToken;
  if (!token) {
    const session = await browserSession.bootstrap();
    token = session?.accessToken;
  }
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Inicia sesión.', '');
  const send = (accessToken: string) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return requestResponse(path, { ...init, headers });
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

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiResponse(path, init);
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export async function authRequest<T>(action: 'login' | 'register', body: unknown): Promise<T> {
  const response = await requestResponse(`/api/v1/auth/${action}`, {
    method: 'POST',
    headers: { 'X-DevPath-Client': 'web' },
    body: JSON.stringify(body),
  });
  return (await response.json()) as T;
}
