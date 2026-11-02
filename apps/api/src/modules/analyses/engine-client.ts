import { HttpError } from '../../platform/errors/http-error.js';
import {
  engineResultSchema,
  validInvariants,
  type EngineInput,
  type EngineResult,
} from './schemas.js';
export interface AnalysisEngine {
  analyze(
    input: EngineInput,
    knownIds: ReadonlySet<string>,
    requestId: string,
    signal: AbortSignal,
  ): Promise<EngineResult>;
}
export function dependencyFailure(): HttpError {
  return new HttpError({
    status: 503,
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'No fue posible obtener un análisis válido.',
  });
}
export function deadlineFailure(): HttpError {
  return new HttpError({
    status: 504,
    code: 'DEPENDENCY_TIMEOUT',
    message: 'El análisis excedió el tiempo de espera. Puedes reintentar con la misma solicitud.',
  });
}
export class EngineClient implements AnalysisEngine {
  private readonly endpoint: URL;
  constructor(private readonly config: { url: string; secret: string; timeoutMs?: number }) {
    const url = new URL(config.url);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/' ||
      !config.secret.trim()
    )
      throw new Error('Invalid internal engine configuration.');
    this.endpoint = new URL('/internal/v1/analyze', url);
  }
  async analyze(
    input: EngineInput,
    knownIds: ReadonlySet<string>,
    requestId: string,
    signal: AbortSignal,
  ): Promise<EngineResult> {
    const combined = AbortSignal.any([signal, AbortSignal.timeout(this.config.timeoutMs ?? 3000)]);
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        redirect: 'error',
        signal: combined,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.config.secret,
          'X-Request-Id': requestId,
        },
        body: JSON.stringify(input),
      });
      if (
        !response.ok ||
        !response.body ||
        !response.headers.get('content-type')?.toLowerCase().startsWith('application/json')
      )
        throw dependencyFailure();
      const reader = response.body.getReader();
      const parts: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > 128 * 1024) throw dependencyFailure();
          parts.push(value);
        }
      } finally {
        await reader.cancel().catch(() => undefined);
      }
      const parsed = engineResultSchema.safeParse(
        JSON.parse(Buffer.concat(parts).toString('utf8')),
      );
      if (!parsed.success || !validInvariants(parsed.data, input, knownIds))
        throw dependencyFailure();
      return parsed.data;
    } catch (error) {
      if (combined.aborted) throw deadlineFailure();
      if (error instanceof HttpError) throw error;
      throw dependencyFailure();
    }
  }
}
