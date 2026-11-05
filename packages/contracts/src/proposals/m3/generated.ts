/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Exactly one group per required skill when evidence is present; skill IDs must be unique. */
export interface AnalysisSkillEvidence {
  /**
   * @maxItems 20
   * @minItems 1
   * @uniqueItems true
   */
  matches: AnalysisSkillMatch[];
  skillId: SkillId;
}

/** Literal catalog alias in the stored original text. Offsets are UTF-16 code units, start inclusive and end exclusive, with start < end. No surrounding context or full source is exposed. */
export interface AnalysisSkillMatch {
  /**
   * @min 1
   * @max 20000
   */
  end: number;
  /**
   * @min 0
   * @max 19999
   */
  start: number;
  /**
   * @minLength 1
   * @maxLength 100
   */
  text: string;
}

/** @min 0 */
export type CandidateSkillsRevision = number;

/**
 * @min 0
 * @max 100
 */
export type CompatibilityPercentage = number | null;

export interface CreateJSearchAnalysisRequest {
  source: {
    /**
     * Opaque provider identifier, not a URL to fetch.
     * @minLength 1
     * @maxLength 512
     * @pattern ^[^\r\n]+$
     */
    providerId: string;
    type: 'jsearch';
  };
}

/** @format date-time */
export type CreatedAt = string;

export interface ErrorResponse {
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'INVALID_CREDENTIALS'
      | 'INVALID_REFRESH_SESSION'
      | 'EMAIL_ALREADY_REGISTERED'
      | 'UNAUTHENTICATED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'IDEMPOTENCY_KEY_REUSED'
      | 'SKILL_IDS_UNKNOWN'
      | 'CONFLICT'
      | 'PAYLOAD_TOO_LARGE'
      | 'UNSUPPORTED_MEDIA_TYPE'
      | 'RATE_LIMITED'
      | 'INTERNAL_ERROR'
      | 'DEPENDENCY_UNAVAILABLE'
      | 'DEPENDENCY_TIMEOUT';
    fields?: Record<string, string[]>;
    /**
     * @minLength 1
     * @maxLength 300
     */
    message: string;
    /** @format uuid */
    requestId: string;
  };
}

/**
 * Optional validated stored technology mentions, never surrounding text. Omitted when unavailable, invalid or the complete DTO would exceed 128 KiB UTF-8. An empty array means no required technologies; older servers may omit this property. Old closed-schema validators must be updated before rollout.
 * @maxItems 100
 */
export type Evidence = AnalysisSkillEvidence[];

/** @format uuid */
export type Id = string;

export interface Job {
  /**
   * @format uri
   * @maxLength 2048
   * @pattern ^https?://
   */
  applyUrl: string | null;
  /** @maxLength 200 */
  company: string | null;
  /**
   * @minLength 1
   * @maxLength 20000
   */
  description: string;
  /** @format date-time */
  fetchedAt: string;
  /** @maxLength 200 */
  location: string | null;
  provider: 'jsearch';
  /**
   * Opaque provider identifier, not a URL to fetch.
   * @minLength 1
   * @maxLength 512
   * @pattern ^[^\r\n]+$
   */
  providerId: string;
  /**
   * @minLength 1
   * @maxLength 200
   */
  title: string;
}

export interface JobDetails {
  job: Job;
  mode: 'fixture' | 'live';
}

export interface JobSearch {
  /** Equivalent to nextCursor !== null; never invent totals. */
  hasNextPage: boolean | null;
  /** @maxItems 50 */
  items: Job[];
  mode: 'fixture' | 'live';
  /**
   * Opaque token to request the next page, or null when no next page is available.
   * @minLength 16
   * @maxLength 2048
   * @pattern ^j1\.[A-Za-z0-9_-]+$
   */
  nextCursor?: string | null;
  /** @min 1 */
  page: number;
}

/**
 * @maxItems 100
 * @uniqueItems true
 */
export type MatchedSkillIds = SkillId[];

/**
 * @maxItems 100
 * @uniqueItems true
 */
export type MissingSkillIds = SkillId[];

/** PROPOSED projection of the existing Analysis DTO with a jsearch source. Not accepted by current M1 validators. JSR-01 must coordinate the source union in public.yaml and all consumers before implementation; all other properties reference M1 unchanged. */
export interface ProposedJSearchAnalysis {
  candidateSkillsRevision: CandidateSkillsRevision;
  compatibilityPercentage: CompatibilityPercentage;
  createdAt: CreatedAt;
  /** Optional validated stored technology mentions, never surrounding text. Omitted when unavailable, invalid or the complete DTO would exceed 128 KiB UTF-8. An empty array means no required technologies; older servers may omit this property. Old closed-schema validators must be updated before rollout. */
  evidence?: Evidence;
  id: Id;
  matchedSkillIds: MatchedSkillIds;
  missingSkillIds: MissingSkillIds;
  requiredSkillIds: RequiredSkillIds;
  skillsOutdated: SkillsOutdated;
  source: ProposedJSearchSourceSummary;
  versions: Versions;
  warnings: Warnings;
}

export interface ProposedJSearchSourceSummary {
  /**
   * Opaque provider identifier, not a URL to fetch.
   * @minLength 1
   * @maxLength 512
   * @pattern ^[^\r\n]+$
   */
  providerId: string;
  /**
   * @minLength 1
   * @maxLength 120
   */
  title: string | null;
  type: 'jsearch';
}

/**
 * @maxItems 100
 * @uniqueItems true
 */
export type RequiredSkillIds = SkillId[];

export type SharedError = ErrorResponse;

/**
 * @minLength 1
 * @maxLength 64
 * @pattern ^[a-z][a-z0-9-]*$
 */
export type SkillId = string;

export type SkillsOutdated = boolean;

export interface Versions {
  /** @pattern ^\d+\.\d+\.\d+$ */
  catalog: string;
  /** @pattern ^\d+\.\d+\.\d+$ */
  extractor: string;
  /** @pattern ^\d+\.\d+\.\d+$ */
  scoring: string;
}

/** @maxItems 20 */
export type Warnings = string[];
