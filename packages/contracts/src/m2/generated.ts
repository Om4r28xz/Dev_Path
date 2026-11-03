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

export interface CreateProjectRequest {
  /**
   * @minLength 1
   * @maxLength 5000
   * @pattern \S
   */
  description: string;
  skillIds: UniqueSkillIds;
  /**
   * @minLength 1
   * @maxLength 120
   * @pattern \S
   */
  title: string;
  /**
   * @format uri
   * @maxLength 2048
   * @pattern ^https?://
   */
  url?: string | null;
}

export interface CvMetadata {
  /** @format date-time */
  createdAt: string;
  /** @format uuid */
  id: string;
  mimeType: 'application/pdf';
  /**
   * @minLength 1
   * @maxLength 255
   * @pattern ^[^\r\n/\\]+$
   */
  originalName: string;
  /**
   * @min 1
   * @max 5242880
   */
  sizeBytes: number;
}

export interface CvUpload {
  /**
   * Exactly one PDF file. Enforce actual streamed bytes <= 5 MiB, .pdf extension (case-insensitive), application/pdf and PDF magic bytes. MIME/extension alone are insufficient. Reject extra multipart parts. No extraction or skills inference.
   * @format binary
   */
  file: File;
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

export interface Project {
  /** @format date-time */
  createdAt: string;
  /**
   * @minLength 1
   * @maxLength 5000
   * @pattern \S
   */
  description: string;
  /** @format uuid */
  id: string;
  skillIds: UniqueSkillIds;
  /**
   * @minLength 1
   * @maxLength 120
   * @pattern \S
   */
  title: string;
  /** @format date-time */
  updatedAt: string;
  /**
   * @format uri
   * @maxLength 2048
   * @pattern ^https?://
   */
  url: string | null;
}

export interface ProjectList {
  /** @maxItems 50 */
  items: Project[];
  /**
   * @minLength 16
   * @maxLength 512
   */
  nextCursor: string | null;
}

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

export interface UpdateProjectRequest {
  /**
   * @minLength 1
   * @maxLength 5000
   * @pattern \S
   */
  description?: string;
  skillIds?: UniqueSkillIds;
  /**
   * @minLength 1
   * @maxLength 120
   * @pattern \S
   */
  title?: string;
  /**
   * @format uri
   * @maxLength 2048
   * @pattern ^https?://
   */
  url?: string | null;
}
