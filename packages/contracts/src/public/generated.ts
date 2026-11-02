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

export interface Analysis {
  /** @min 0 */
  candidateSkillsRevision: number;
  /**
   * @min 0
   * @max 100
   */
  compatibilityPercentage: number | null;
  /** @format date-time */
  createdAt: string;
  /**
   * Optional validated stored technology mentions, never surrounding text. Omitted when unavailable, invalid or the complete DTO would exceed 128 KiB UTF-8. An empty array means no required technologies; older servers may omit this property. Old closed-schema validators must be updated before rollout.
   * @maxItems 100
   */
  evidence?: AnalysisSkillEvidence[];
  /** @format uuid */
  id: string;
  matchedSkillIds: UniqueSkillIds;
  missingSkillIds: UniqueSkillIds;
  requiredSkillIds: UniqueSkillIds;
  skillsOutdated: boolean;
  source: AnalysisSourceSummary;
  versions: AnalysisVersions;
  /** @maxItems 20 */
  warnings: string[];
}

export interface AnalysisListResponse {
  /** @maxItems 50 */
  items: AnalysisSummary[];
  /**
   * @minLength 16
   * @maxLength 512
   */
  nextCursor: string | null;
}

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

export interface AnalysisSourceSummary {
  /**
   * @minLength 1
   * @maxLength 120
   */
  title: string | null;
  type: 'text';
}

export interface AnalysisSummary {
  /**
   * @min 0
   * @max 100
   */
  compatibilityPercentage: number | null;
  /** @format date-time */
  createdAt: string;
  /** @format uuid */
  id: string;
  skillsOutdated: boolean;
  source: AnalysisSourceSummary;
}

export interface AnalysisVersions {
  /** @pattern ^\d+\.\d+\.\d+$ */
  catalog: string;
  /** @pattern ^\d+\.\d+\.\d+$ */
  extractor: string;
  /** @pattern ^\d+\.\d+\.\d+$ */
  scoring: string;
}

export interface CreateAnalysisRequest {
  source: TextAnalysisSourceInput;
}

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

export interface LoginRequest {
  /**
   * @format email
   * @maxLength 254
   */
  email: string;
  /**
   * @minLength 1
   * @maxLength 128
   */
  password: string;
}

export interface RegisterRequest {
  /**
   * @format email
   * @maxLength 254
   */
  email: string;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /**
   * @minLength 12
   * @maxLength 128
   */
  password: string;
}

export interface ReplaceUserSkillsRequest {
  /**
   * @maxItems 100
   * @uniqueItems true
   */
  skillIds: SkillId[];
}

export interface SessionResponse {
  /**
   * Short-lived JWT; the browser keeps it only in memory.
   * @minLength 1
   */
  accessToken: string;
  /** Access token lifetime in seconds. */
  expiresIn: 900;
  tokenType: 'Bearer';
  user: SessionUser;
}

export interface SessionUser {
  /**
   * @format email
   * @maxLength 254
   */
  email: string;
  /** @format uuid */
  id: string;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
}

export interface Skill {
  category: 'language' | 'library' | 'framework' | 'runtime' | 'tool' | 'platform';
  id: SkillId;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
}

/**
 * @minLength 1
 * @maxLength 64
 * @pattern ^[a-z][a-z0-9-]*$
 */
export type SkillId = string;

export interface SkillListResponse {
  catalogVersion: '1.0.0';
  /** @maxItems 50 */
  items: Skill[];
  /**
   * @minLength 16
   * @maxLength 512
   */
  nextCursor: string | null;
}

export interface TextAnalysisSourceInput {
  /**
   * @minLength 1
   * @maxLength 20000
   */
  text: string;
  /**
   * @minLength 1
   * @maxLength 120
   */
  title?: string;
  type: 'text';
}

/**
 * @maxItems 100
 * @uniqueItems true
 */
export type UniqueSkillIds = SkillId[];

export interface UpdateMeRequest {
  /**
   * @minLength 1
   * @maxLength 160
   */
  headline?: string | null;
  /**
   * @minLength 1
   * @maxLength 120
   */
  location?: string | null;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name?: string;
}

export interface UserProfile {
  /** @format date-time */
  createdAt: string;
  /**
   * @format email
   * @maxLength 254
   */
  email: string;
  /**
   * @minLength 1
   * @maxLength 160
   */
  headline: string | null;
  /** @format uuid */
  id: string;
  /**
   * @minLength 1
   * @maxLength 120
   */
  location: string | null;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /** @min 0 */
  skillsRevision: number;
  /** @format date-time */
  updatedAt: string;
}

export interface UserSkillsResponse {
  /** @min 0 */
  revision: number;
  /**
   * @maxItems 100
   * @uniqueItems true
   */
  skillIds: SkillId[];
}
