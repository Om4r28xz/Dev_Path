import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from '../../../lib/http/client.js';
import { AnalysisResult } from '../../analyses/components/AnalysisResult.js';
import { parseAnalysis } from '../../analyses/validation.js';
import {
  analyzeProviderJob,
  getJobDetails,
  JobsResponseError,
  parseJobSearch,
  searchJobs,
} from '../api/index.js';
import { describeProviderError } from './JobsPage.js';

vi.mock('../../../lib/http/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/http/client.js')>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

describe('JSR-04 jobs API client, HTML escaping, attribution, and shared AnalysisResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('constructs search, cursor continuation, details, and provider analysis requests properly', async () => {
    const signal = new AbortController().signal;

    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [
        {
          provider: 'jsearch',
          providerId: 'synthetic-job-001',
          title: 'Frontend junior (sintético)',
          company: 'Empresa de ejemplo',
          location: 'Remoto',
          description: 'Vacante sintética: JavaScript, React y Git.',
          applyUrl: 'https://example.test/jobs/synthetic-job-001',
          fetchedAt: '2026-11-04T12:00:00.000Z',
        },
      ],
      page: 1,
      hasNextPage: true,
      nextCursor: 'j1.synthetic_cursor_token',
      mode: 'fixture',
    });

    const page1 = await searchJobs({ q: ' React ', location: ' Remoto ' }, signal);
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/jobs?q=React&location=Remoto&page=1', {
      signal,
    });
    expect(page1.mode).toBe('fixture');
    expect(page1.nextCursor).toBe('j1.synthetic_cursor_token');

    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [],
      page: 2,
      hasNextPage: false,
      nextCursor: null,
      mode: 'fixture',
    });

    await searchJobs({ q: 'React', cursor: page1.nextCursor }, signal);
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/v1/jobs?q=React&cursor=j1.synthetic_cursor_token',
      { signal },
    );

    vi.mocked(apiRequest).mockResolvedValueOnce({
      job: page1.items[0],
      mode: 'fixture',
    });

    const details = await getJobDetails('synthetic-job-001', signal);
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/jobs/details?providerId=synthetic-job-001', {
      signal,
    });
    expect(details.job.providerId).toBe('synthetic-job-001');

    vi.mocked(apiRequest).mockResolvedValueOnce({
      id: '5e9220ea-e5b7-42bb-8a88-adf08763837f',
      source: {
        type: 'jsearch',
        title: 'Frontend junior (sintético)',
        providerId: 'synthetic-job-001',
      },
      candidateSkillsRevision: 1,
      requiredSkillIds: ['git', 'javascript', 'react'],
      matchedSkillIds: ['javascript', 'react'],
      missingSkillIds: ['git'],
      compatibilityPercentage: 67,
      versions: { catalog: '1.0.0', extractor: '1.0.0', scoring: '1.0.0' },
      warnings: [],
      skillsOutdated: false,
      createdAt: '2026-11-05T12:00:00.000Z',
    });

    const analysis = await analyzeProviderJob(
      'synthetic-job-001',
      '5e9220ea-e5b7-42bb-8a88-adf08763837f',
      signal,
    );
    expect(analysis.source).toEqual({
      type: 'jsearch',
      title: 'Frontend junior (sintético)',
      providerId: 'synthetic-job-001',
    });
    expect(analysis.compatibilityPercentage).toBe(67);
  });

  it('rejects arbitrary URLs as providerId or invalid modes in parseJobSearch', () => {
    expect(() =>
      parseJobSearch({
        items: [
          {
            provider: 'jsearch',
            providerId: 'https://evil.example/ssrf',
            title: 'Bad',
            company: null,
            location: null,
            description: 'Desc',
            applyUrl: null,
            fetchedAt: '2026-11-04T12:00:00.000Z',
          },
        ],
        page: 1,
        hasNextPage: false,
        mode: 'fixture',
      }),
    ).toThrow(JobsResponseError);

    expect(() =>
      parseJobSearch({
        items: [],
        page: 1,
        hasNextPage: false,
        mode: 'unknown-mode',
      }),
    ).toThrow(JobsResponseError);
  });

  it('renders jsearch analysis with the shared AnalysisResult component and escapes HTML without predicting hiring', () => {
    const analysis = parseAnalysis({
      id: '5e9220ea-e5b7-42bb-8a88-adf08763837f',
      source: {
        type: 'jsearch',
        title: '<script>alert(1)</script> Frontend junior',
        providerId: 'synthetic-job-001',
      },
      candidateSkillsRevision: 1,
      requiredSkillIds: ['git', 'javascript', 'react'],
      matchedSkillIds: ['javascript', 'react'],
      missingSkillIds: ['git'],
      compatibilityPercentage: 67,
      versions: { catalog: '1.0.0', extractor: '1.0.0', scoring: '1.0.0' },
      warnings: [],
      skillsOutdated: false,
      createdAt: '2026-11-05T12:00:00.000Z',
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AnalysisResult
          analysis={analysis}
          skillNames={{ git: 'Git', javascript: 'JavaScript', react: 'React' }}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('67%');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; Frontend junior');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('no es una probabilidad de contratación');
  });

  it('maps 429 quota, 504 timeout, and 503 unavailable errors to clear Spanish explanations', () => {
    expect(
      describeProviderError(new ApiError(429, 'RATE_LIMITED', 'Rate limit', ''), 'search'),
    ).toContain('HTTP 429');
    expect(
      describeProviderError(new ApiError(504, 'DEPENDENCY_TIMEOUT', 'Timeout', ''), 'search'),
    ).toContain('timeout de 5 s');
    expect(
      describeProviderError(
        new ApiError(503, 'DEPENDENCY_UNAVAILABLE', 'Unavailable', ''),
        'analyze',
      ),
    ).toContain('permiso de retención live');
  });
});
