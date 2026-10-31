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

export interface AnalyzeRequest {
  /**
   * @maxItems 100
   * @uniqueItems true
   */
  candidateSkillIds: SkillId[];
  /** @pattern ^\d+\.\d+\.\d+$ */
  catalogVersion: string;
  /**
   * @minLength 1
   * @maxLength 20000
   */
  jobText: string;
}

export interface AnalyzeResponse {
  /** @maxItems 100 */
  evidence: SkillEvidence[];
  /**
   * round(100 * matched / required), or null when there are no required skills.
   * @min 0
   * @max 100
   */
  matchPercentage: number | null;
  matchedSkillIds: UniqueSkillIds;
  missingSkillIds: UniqueSkillIds;
  requiredSkillIds: UniqueSkillIds;
  versions: EngineVersions;
}

export interface EngineVersions {
  /** @pattern ^\d+\.\d+\.\d+$ */
  catalog: string;
  /** @pattern ^\d+\.\d+\.\d+$ */
  extractor: string;
  /** @pattern ^\d+\.\d+\.\d+$ */
  scoring: string;
}

export interface InternalErrorResponse {
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'INVALID_SERVICE_CREDENTIAL'
      | 'CATALOG_VERSION_MISMATCH'
      | 'PAYLOAD_TOO_LARGE'
      | 'INTERNAL_ERROR';
    /**
     * @minLength 1
     * @maxLength 300
     */
    message: string;
    /** @format uuid */
    requestId: string;
  };
}

export interface SkillEvidence {
  /**
   * @maxItems 20
   * @minItems 1
   */
  matches: {
    /** @min 1 */
    end: number;
    /** @min 0 */
    start: number;
    /**
     * @minLength 1
     * @maxLength 100
     */
    text: string;
  }[];
  skillId: SkillId;
}

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
