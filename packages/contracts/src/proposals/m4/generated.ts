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

export interface CreateLearningPathRequest {
  /** @format uuid */
  analysisId: string;
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

export interface LearningPath {
  /** @format uuid */
  analysisId: string;
  /** @format date-time */
  createdAt: string;
  /** @format uuid */
  id: string;
  /** @maxLength 500 */
  message: string | null;
  progress: LearningProgress;
  /** @min 0 */
  projectsRevision: number;
  /** @maxItems 200 */
  steps: LearningStep[];
  /** @format date-time */
  updatedAt: string;
  versions: {
    /**
     * @minLength 1
     * @maxLength 40
     */
    catalog: string;
    /**
     * @minLength 1
     * @maxLength 40
     */
    content: string;
    /**
     * @minLength 1
     * @maxLength 40
     */
    generator: string;
  };
}

export interface LearningPathList {
  /** @maxItems 50 */
  items: LearningPath[];
  /**
   * @minLength 16
   * @maxLength 512
   */
  nextCursor: string | null;
}

export type LearningProgress = {
  /**
   * @min 0
   * @max 200
   */
  completed: number;
  /**
   * @min 0
   * @max 100
   */
  percentage: number | null;
  /**
   * @min 0
   * @max 200
   */
  total: number;
};

export type LearningStep = {
  /**
   * @minLength 1
   * @maxLength 5000
   */
  activity: string;
  /** @format date-time */
  completedAt: string | null;
  /** @format uuid */
  id: string;
  /** @format uuid */
  projectId: string | null;
  /**
   * @minLength 1
   * @maxLength 1000
   */
  reason: string;
  /**
   * @format uri
   * @maxLength 2048
   * @pattern ^https?://
   */
  resourceUrl: string | null;
  skillIds: UniqueSkillIds;
  status: 'pending' | 'in_progress' | 'completed';
  /**
   * @minLength 1
   * @maxLength 120
   */
  title: string;
};

export type SharedError = ErrorResponse;

/**
 * @minLength 1
 * @maxLength 64
 * @pattern ^[a-z][a-z0-9-]*$
 */
export type SkillId = string;

/**
 * @maxItems 100
 * @uniqueItems true
 */
export type UniqueSkillIds = SkillId[];

export interface UpdateLearningStepRequest {
  status: 'pending' | 'in_progress' | 'completed';
}
