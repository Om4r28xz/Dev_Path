export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string;

  constructor(status: number, code: string, message: string, requestId: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let code = 'UNKNOWN_ERROR';
    let message = `HTTP ${response.status}`;
    let requestId = '';

    try {
      const envelope = (await response.json()) as ErrorEnvelope;
      code = envelope.error.code;
      message = envelope.error.message;
      requestId = envelope.error.requestId;
    } catch {
      // Use defaults if parsing fails
    }

    throw new ApiError(response.status, code, message, requestId);
  }

  return response.json() as Promise<T>;
}
