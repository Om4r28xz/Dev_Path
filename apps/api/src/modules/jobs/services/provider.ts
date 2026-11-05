import { z } from 'zod';
import { HttpError } from '../../../platform/errors/http-error.js';

export type JobsProviderMode = 'fixture' | 'live';

export interface NormalizedJob {
  readonly provider: 'jsearch';
  readonly providerId: string;
  readonly title: string;
  readonly company: string | null;
  readonly location: string | null;
  readonly description: string;
  readonly applyUrl: string | null;
  readonly fetchedAt: string;
}

export interface JobsProviderSearchInput {
  readonly q: string;
  readonly location?: string | undefined;
  readonly upstreamCursor?: string | undefined;
  readonly signal?: AbortSignal | undefined;
}

export interface JobsProviderSearchOutput {
  readonly items: readonly NormalizedJob[];
  readonly upstreamNextCursor: string | null;
  readonly mode: JobsProviderMode;
}

export interface JobsProviderDetailsInput {
  readonly providerId: string;
  readonly signal?: AbortSignal | undefined;
}

export interface JobsProviderDetailsOutput {
  readonly job: NormalizedJob;
  readonly mode: JobsProviderMode;
}

export interface JobsProvider {
  readonly mode: JobsProviderMode;
  readonly country: string;
  readonly language: string;
  search(input: JobsProviderSearchInput): Promise<JobsProviderSearchOutput>;
  details(input: JobsProviderDetailsInput): Promise<JobsProviderDetailsOutput>;
}

const SYNTHETIC_FETCHED_AT = '2026-11-04T12:00:00.000Z';

const SYNTHETIC_JOBS: readonly NormalizedJob[] = [
  {
    provider: 'jsearch',
    providerId: 'synthetic-job-001',
    title: 'Frontend junior (sintético)',
    company: 'Empresa de ejemplo',
    location: 'Remoto',
    description: 'Vacante sintética: JavaScript, React y Git.',
    applyUrl: 'https://example.test/jobs/synthetic-job-001',
    fetchedAt: SYNTHETIC_FETCHED_AT,
  },
  {
    provider: 'jsearch',
    providerId: 'synthetic-job-002',
    title: 'Desarrollador Fullstack Junior (sintético)',
    company: 'Laboratorio Demo DevPath',
    location: 'Ciudad de México / Híbrido',
    description:
      'Vacante sintética de demostración: buscamos TypeScript, React, Node.js, SQL y Git para plataforma educativa.',
    applyUrl: 'https://example.test/jobs/synthetic-job-002',
    fetchedAt: SYNTHETIC_FETCHED_AT,
  },
  {
    provider: 'jsearch',
    providerId: 'synthetic-job-003',
    title: 'Backend Node.js Junior (sintético)',
    company: 'Sistemas Sintéticos S.A.',
    location: 'Remoto',
    description:
      'Oferta sintética: desarrollo de servicios REST con Node.js, TypeScript, PostgreSQL, SQL, Docker y Git.',
    applyUrl: 'https://example.test/jobs/synthetic-job-003',
    fetchedAt: SYNTHETIC_FETCHED_AT,
  },
];

export class FixtureJobsProvider implements JobsProvider {
  readonly mode = 'fixture' as const;
  readonly country: string;
  readonly language: string;

  constructor(options?: {
    readonly country?: string;
    readonly language?: string;
    readonly jobs?: readonly NormalizedJob[];
    readonly pageSize?: number;
  }) {
    this.country = (options?.country ?? 'mx').trim().toLowerCase();
    this.language = (options?.language ?? 'es').trim().toLowerCase();
    this.jobs = options?.jobs ?? SYNTHETIC_JOBS;
    this.pageSize = options?.pageSize ?? 2;
  }

  private readonly jobs: readonly NormalizedJob[];
  private readonly pageSize: number;

  async search(input: JobsProviderSearchInput): Promise<JobsProviderSearchOutput> {
    const queryLower = input.q.trim().toLowerCase();
    const locationLower = input.location?.trim().toLowerCase();

    const matched = this.jobs.filter((job) => {
      const haystack =
        `${job.title} ${job.company ?? ''} ${job.description} ${job.location ?? ''}`.toLowerCase();
      const queryTokens = queryLower.split(/\s+/u).filter(Boolean);
      const matchesQuery =
        haystack.includes(queryLower) || queryTokens.every((token) => haystack.includes(token));
      if (!matchesQuery) return false;
      if (locationLower) {
        const jobLoc = (job.location ?? '').toLowerCase();
        if (!jobLoc.includes(locationLower)) return false;
      }
      return true;
    });

    if (matched.length === 0) {
      return {
        items: [],
        upstreamNextCursor: null,
        mode: 'fixture',
      };
    }

    if (!input.upstreamCursor) {
      const pageItems = matched.slice(0, this.pageSize);
      const hasMore = matched.length > this.pageSize;
      return {
        items: pageItems,
        upstreamNextCursor: hasMore ? 'synthetic-next-cursor' : null,
        mode: 'fixture',
      };
    }

    if (input.upstreamCursor === 'synthetic-next-cursor') {
      const nextItems = matched.slice(this.pageSize, this.pageSize * 2);
      return {
        items: nextItems,
        upstreamNextCursor: null,
        mode: 'fixture',
      };
    }

    return {
      items: [],
      upstreamNextCursor: null,
      mode: 'fixture',
    };
  }

  async details(input: JobsProviderDetailsInput): Promise<JobsProviderDetailsOutput> {
    const found = this.jobs.find((job) => job.providerId === input.providerId);
    if (!found) {
      throw jobNotFound();
    }
    return {
      job: found,
      mode: 'fixture',
    };
  }
}

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const JSEARCH_BASE_URL = `https://${JSEARCH_HOST}`;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 5000;

const upstreamJobSchema = z
  .object({
    job_id: z.string().trim().min(1).max(512),
    job_title: z.string().trim().min(1),
    employer_name: z.string().trim().nullable().optional(),
    job_location: z.string().trim().nullable().optional(),
    job_city: z.string().trim().nullable().optional(),
    job_state: z.string().trim().nullable().optional(),
    job_country: z.string().trim().nullable().optional(),
    job_description: z.string().trim().min(1),
    job_apply_link: z.string().trim().nullable().optional(),
  })
  .passthrough();

const upstreamCursorSchema = z.string().trim().min(1).max(1500).nullable().optional();

const upstreamSearchV2DataSchema = z
  .object({
    jobs: z.array(upstreamJobSchema).max(50),
    cursor: upstreamCursorSchema,
  })
  .passthrough();

const upstreamSearchEnvelopeSchema = z
  .object({
    status: z.string(),
    data: z.union([upstreamSearchV2DataSchema, z.array(upstreamJobSchema).max(50)]),
    cursor: upstreamCursorSchema,
  })
  .passthrough();

const upstreamDetailsEnvelopeSchema = z
  .object({
    status: z.string(),
    data: z.array(upstreamJobSchema),
  })
  .passthrough();

export interface LiveJSearchProviderOptions {
  readonly apiKey?: string | undefined;
  readonly liveEnabled?: boolean | undefined;
  readonly country?: string | undefined;
  readonly language?: string | undefined;
  readonly timeoutMs?: number | undefined;
  readonly maxResponseBytes?: number | undefined;
  readonly fetchFn?: typeof fetch | undefined;
  readonly nowIso?: (() => string) | undefined;
}

export class LiveJSearchProvider implements JobsProvider {
  readonly mode = 'live' as const;
  readonly country: string;
  readonly language: string;
  private readonly apiKey: string;
  private readonly liveEnabled: boolean;
  private readonly timeoutMs: number;
  private readonly maxResponseBytes: number;
  private readonly fetchFn: typeof fetch;
  private readonly nowIso: () => string;

  constructor(options: LiveJSearchProviderOptions) {
    this.apiKey = options.apiKey?.trim() ?? '';
    this.liveEnabled = options.liveEnabled === true;
    this.country = (options.country ?? 'mx').trim().toLowerCase();
    this.language = (options.language ?? 'es').trim().toLowerCase();
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxResponseBytes = options.maxResponseBytes ?? MAX_RESPONSE_BYTES;
    this.fetchFn = options.fetchFn ?? fetch;
    this.nowIso = options.nowIso ?? (() => new Date().toISOString());
  }

  private assertLiveReady(): void {
    if (!this.liveEnabled || !this.apiKey) {
      throw providerUnavailable();
    }
  }

  async search(input: JobsProviderSearchInput): Promise<JobsProviderSearchOutput> {
    this.assertLiveReady();
    const url = new URL('/search-v2', JSEARCH_BASE_URL);
    const composedQuery = input.location
      ? `${input.q.trim()} in ${input.location.trim()}`
      : input.q.trim();
    url.searchParams.set('query', composedQuery);
    url.searchParams.set('num_pages', '1');
    url.searchParams.set('country', this.country);
    url.searchParams.set('language', this.language);
    if (input.upstreamCursor) {
      url.searchParams.set('cursor', input.upstreamCursor);
    }

    const raw = await this.requestJson(url, input.signal, false);
    const parsed = upstreamSearchEnvelopeSchema.safeParse(raw);
    if (!parsed.success || parsed.data.status.toUpperCase() !== 'OK') {
      throw providerUnavailable();
    }

    const rawJobs = Array.isArray(parsed.data.data) ? parsed.data.data : parsed.data.data.jobs;
    const rawCursor = Array.isArray(parsed.data.data)
      ? parsed.data.cursor
      : (parsed.data.data.cursor ?? parsed.data.cursor);

    const fetchedAt = this.nowIso();
    const items = rawJobs.slice(0, 10).map((item) => normalizeUpstreamJob(item, fetchedAt));
    const nextCursor = items.length > 0 && rawCursor ? rawCursor : null;

    return {
      items,
      upstreamNextCursor: nextCursor,
      mode: 'live',
    };
  }

  async details(input: JobsProviderDetailsInput): Promise<JobsProviderDetailsOutput> {
    this.assertLiveReady();
    const url = new URL('/job-details', JSEARCH_BASE_URL);
    url.searchParams.set('job_id', input.providerId.trim());

    const raw = await this.requestJson(url, input.signal, true);
    const parsed = upstreamDetailsEnvelopeSchema.safeParse(raw);
    if (!parsed.success || parsed.data.status.toUpperCase() !== 'OK') {
      throw providerUnavailable();
    }

    const first = parsed.data.data[0];
    if (!first) {
      throw jobNotFound();
    }

    return {
      job: normalizeUpstreamJob(first, this.nowIso()),
      mode: 'live',
    };
  }

  private async requestJson(
    url: URL,
    callerSignal: AbortSignal | undefined,
    allow404: boolean,
  ): Promise<unknown> {
    if (url.origin !== JSEARCH_BASE_URL || url.host !== JSEARCH_HOST) {
      throw providerUnavailable();
    }
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const combinedSignal = callerSignal
      ? AbortSignal.any([callerSignal, timeoutSignal])
      : timeoutSignal;

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: 'GET',
        redirect: 'error',
        signal: combinedSignal,
        headers: {
          Accept: 'application/json',
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': JSEARCH_HOST,
        },
      });
    } catch (error) {
      if (combinedSignal.aborted) {
        throw providerTimeout();
      }
      if (error instanceof HttpError) throw error;
      throw providerUnavailable();
    }

    if (response.status === 429) {
      const retryAfter = sanitizeRetryAfter(response.headers.get('retry-after'));
      throw providerRateLimited(retryAfter);
    }

    if (allow404 && response.status === 404) {
      throw jobNotFound();
    }

    if (
      !response.ok ||
      !response.body ||
      !response.headers.get('content-type')?.toLowerCase().includes('application/json')
    ) {
      throw providerUnavailable();
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > this.maxResponseBytes) {
          throw providerUnavailable();
        }
        chunks.push(value);
      }
    } catch (error) {
      if (combinedSignal.aborted) {
        throw providerTimeout();
      }
      if (error instanceof HttpError) throw error;
      throw providerUnavailable();
    } finally {
      await reader.cancel().catch(() => undefined);
    }

    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw providerUnavailable();
    }
  }
}

function normalizeUpstreamJob(
  item: z.infer<typeof upstreamJobSchema>,
  fetchedAt: string,
): NormalizedJob {
  const providerId = item.job_id
    .replace(/[\r\n]+/gu, ' ')
    .trim()
    .slice(0, 512);
  if (!providerId || /^[a-z][a-z0-9+.-]*:\/\//iu.test(providerId)) {
    throw providerUnavailable();
  }
  const title = item.job_title.trim().slice(0, 200);
  const company = item.employer_name?.trim() ? item.employer_name.trim().slice(0, 200) : null;
  const fallbackLocation = [item.job_city, item.job_state, item.job_country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
  const rawLocation = item.job_location?.trim() || fallbackLocation;
  const location = rawLocation ? rawLocation.slice(0, 200) : null;
  const description = item.job_description.trim().slice(0, 20_000);
  const applyUrl = sanitizeApplyUrl(item.job_apply_link);

  if (!title || !description) {
    throw providerUnavailable();
  }

  return {
    provider: 'jsearch',
    providerId,
    title,
    company,
    location,
    description,
    applyUrl,
    fetchedAt,
  };
}

function sanitizeApplyUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  try {
    const parsed = new URL(trimmed);
    if (
      (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
      parsed.username !== '' ||
      parsed.password !== ''
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizeRetryAfter(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!/^\d+$/u.test(trimmed)) return undefined;
  const seconds = Number(trimmed);
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 3600) return undefined;
  return String(seconds);
}

export function jobNotFound(): HttpError {
  return new HttpError({
    status: 404,
    code: 'NOT_FOUND',
    message: 'No se encontró la vacante solicitada.',
  });
}

export function providerRateLimited(retryAfterSeconds?: string): HttpError {
  return new HttpError({
    status: 429,
    code: 'RATE_LIMITED',
    message:
      'Se alcanzó el límite de consultas del proveedor de vacantes. Espera antes de volver a intentar.',
    ...(retryAfterSeconds ? { headers: { 'Retry-After': retryAfterSeconds } } : {}),
  });
}

export function providerTimeout(): HttpError {
  return new HttpError({
    status: 504,
    code: 'DEPENDENCY_TIMEOUT',
    message: 'El proveedor de vacantes excedió el tiempo de espera (5 s).',
  });
}

export function providerUnavailable(): HttpError {
  return new HttpError({
    status: 503,
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'El proveedor de vacantes no está disponible en este momento.',
  });
}

export function createJobsProviderFromEnv(env: NodeJS.ProcessEnv = process.env): JobsProvider {
  const rawMode = env.JOBS_PROVIDER_MODE?.trim() || 'fixture';
  if (rawMode !== 'fixture' && rawMode !== 'live') {
    throw new Error('JOBS_PROVIDER_MODE debe ser fixture o live.');
  }
  const country = env.JOBS_DEFAULT_COUNTRY?.trim() || 'mx';
  const language = env.JOBS_DEFAULT_LANGUAGE?.trim() || 'es';

  if (rawMode === 'fixture') {
    return new FixtureJobsProvider({ country, language });
  }

  const liveEnabled = env.JOBS_LIVE_ENABLED === 'true';
  const apiKey = env.RAPIDAPI_KEY?.trim() ?? '';
  if (env.NODE_ENV === 'production' && (!liveEnabled || !apiKey)) {
    throw new Error(
      'En production, JOBS_PROVIDER_MODE=live requiere JOBS_LIVE_ENABLED=true y RAPIDAPI_KEY.',
    );
  }

  return new LiveJSearchProvider({
    apiKey,
    liveEnabled,
    country,
    language,
  });
}
