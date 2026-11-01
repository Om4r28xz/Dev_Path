export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; requestId?: string };
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/api/v1/')) throw new Error('Only same-origin API paths are supported.');
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { ...init, credentials: 'same-origin', headers });
  if (!response.ok) {
    let envelope: ErrorEnvelope = {};
    try {
      envelope = (await response.json()) as ErrorEnvelope;
    } catch {
      // The status remains available when the body is not JSON.
    }
    throw new ApiError(
      response.status,
      envelope.error?.code ?? 'UNKNOWN_ERROR',
      envelope.error?.message ?? `HTTP ${response.status}`,
      envelope.error?.requestId ?? '',
    );
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export function authHeaders(): Headers {
  return new Headers({ 'X-DevPath-Client': 'web', 'Content-Type': 'application/json' });
}
