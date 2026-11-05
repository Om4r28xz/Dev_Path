import { apiRequest } from '../../../lib/http/client.js';
import { createAnalysis } from '../../analyses/api.js';
import type { Analysis } from '../../analyses/types.js';
import type {
  Job,
  JobDetails,
  JobSearch,
} from '../../../../../../packages/contracts/src/proposals/m3/generated.js';

export type { Job, JobDetails, JobSearch };
export type JobsMode = JobSearch['mode'];

export class JobsResponseError extends Error {
  constructor() {
    super('La respuesta del servicio de vacantes no es válida.');
  }
}

function invalid(): never {
  throw new JobsResponseError();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseJob(value: unknown): Job {
  if (!isRecord(value)) return invalid();
  const { provider, providerId, title, company, location, description, applyUrl, fetchedAt } =
    value;

  if (provider !== 'jsearch') return invalid();
  if (
    typeof providerId !== 'string' ||
    !providerId.trim() ||
    providerId.length > 512 ||
    /[\r\n]/u.test(providerId) ||
    /^[a-z][a-z0-9+.-]*:\/\//iu.test(providerId)
  ) {
    return invalid();
  }
  if (typeof title !== 'string' || !title.trim() || title.length > 200) return invalid();
  if (company !== null && (typeof company !== 'string' || company.length > 200)) return invalid();
  if (location !== null && (typeof location !== 'string' || location.length > 200))
    return invalid();
  if (typeof description !== 'string' || !description.trim() || description.length > 20000)
    return invalid();
  if (applyUrl !== null) {
    if (typeof applyUrl !== 'string' || applyUrl.length > 2048 || !/^https?:\/\//iu.test(applyUrl))
      return invalid();
  }
  if (typeof fetchedAt !== 'string' || !Number.isFinite(Date.parse(fetchedAt))) return invalid();

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

export function parseJobSearch(value: unknown): JobSearch {
  if (!isRecord(value)) return invalid();
  const { items, page, hasNextPage, nextCursor, mode } = value;
  if (!Array.isArray(items) || items.length > 50) return invalid();
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) return invalid();
  if (hasNextPage !== null && typeof hasNextPage !== 'boolean') return invalid();
  if (
    nextCursor !== undefined &&
    nextCursor !== null &&
    (typeof nextCursor !== 'string' ||
      nextCursor.length < 16 ||
      nextCursor.length > 2048 ||
      !/^j1\.[A-Za-z0-9_-]+$/u.test(nextCursor))
  ) {
    return invalid();
  }
  if (mode !== 'fixture' && mode !== 'live') return invalid();

  return {
    items: items.map(parseJob),
    page,
    hasNextPage,
    ...(nextCursor !== undefined ? { nextCursor } : {}),
    mode,
  };
}

export function parseJobDetails(value: unknown): JobDetails {
  if (!isRecord(value)) return invalid();
  const { job, mode } = value;
  if (mode !== 'fixture' && mode !== 'live') return invalid();
  return {
    job: parseJob(job),
    mode,
  };
}

export function searchJobs(
  params: {
    q: string;
    location?: string | undefined;
    cursor?: string | null | undefined;
  },
  signal: AbortSignal,
): Promise<JobSearch> {
  const searchParams = new URLSearchParams();
  searchParams.set('q', params.q.trim());
  if (params.location?.trim()) {
    searchParams.set('location', params.location.trim());
  }
  if (params.cursor) {
    searchParams.set('cursor', params.cursor);
  } else {
    searchParams.set('page', '1');
  }
  return apiRequest<unknown>(`/api/v1/jobs?${searchParams.toString()}`, { signal }).then(
    parseJobSearch,
  );
}

export function getJobDetails(providerId: string, signal: AbortSignal): Promise<JobDetails> {
  const searchParams = new URLSearchParams({ providerId: providerId.trim() });
  return apiRequest<unknown>(`/api/v1/jobs/details?${searchParams.toString()}`, { signal }).then(
    parseJobDetails,
  );
}

export function analyzeProviderJob(
  providerId: string,
  idempotencyKey: string,
  signal: AbortSignal,
): Promise<Analysis> {
  return createAnalysis(
    {
      source: {
        type: 'jsearch',
        providerId: providerId.trim(),
      },
    },
    idempotencyKey,
    signal,
  );
}
