import type { RequestHandler } from 'express';
import { z } from 'zod';

import { HttpError } from '../../platform/errors/http-error.js';
import type { LoadedCatalog } from './catalog.js';
import { EXTRACTOR_VERSION, extractSkills } from './extractor.js';
import { SCORING_VERSION, scoreAnalysis } from './scorer.js';

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/u;
const SKILL_ID_PATTERN = /^[a-z][a-z0-9-]*$/u;

const analyzeBodySchema = z.object({
  catalogVersion: z.string().regex(SEMVER_PATTERN, 'catalogVersion must be a valid semver string.'),
  jobText: z.string().min(1).max(20_000),
  candidateSkillIds: z
    .array(
      z
        .string()
        .min(1)
        .max(64)
        .regex(SKILL_ID_PATTERN, 'Each skill ID must match ^[a-z][a-z0-9-]*$.'),
    )
    .max(100),
});

export interface AnalyzeHandlerOptions {
  readonly catalog: LoadedCatalog;
  readonly serviceSecret: string;
}

export function createAnalyzeHandler(options: AnalyzeHandlerOptions): RequestHandler {
  return (request, response, next) => {
    try {
      // Validate service credential
      const authHeader = request.get('Authorization') ?? '';
      const expectedBearer = `Bearer ${options.serviceSecret}`;

      if (authHeader !== expectedBearer) {
        throw new HttpError({
          status: 401,
          code: 'INVALID_SERVICE_CREDENTIAL',
          message: 'Credencial de servicio inválida o ausente.',
        });
      }

      // Validate request body
      const parseResult = analyzeBodySchema.safeParse(request.body);
      if (!parseResult.success) {
        const fields: Record<string, string[]> = {};
        for (const issue of parseResult.error.issues) {
          const fieldPath = issue.path.join('.') || 'body';
          fields[fieldPath] ??= [];
          fields[fieldPath].push(issue.message);
        }

        throw new HttpError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'El cuerpo de la solicitud contiene errores de validación.',
          fields,
        });
      }

      const body = parseResult.data;

      // Validate uniqueness of candidateSkillIds
      const uniqueIds = new Set(body.candidateSkillIds);
      if (uniqueIds.size !== body.candidateSkillIds.length) {
        throw new HttpError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'El cuerpo de la solicitud contiene errores de validación.',
          fields: { candidateSkillIds: ['candidateSkillIds must contain unique values.'] },
        });
      }

      // Check catalog version match
      if (body.catalogVersion !== options.catalog.version) {
        throw new HttpError({
          status: 409,
          code: 'CATALOG_VERSION_MISMATCH',
          message: `La versión del catálogo solicitada (${body.catalogVersion}) no coincide con la versión cargada (${options.catalog.version}).`,
        });
      }

      // Extract skills from job text
      const evidence = extractSkills(body.jobText, options.catalog);
      const requiredSkillIds = evidence.map((e) => e.skillId);

      // Score analysis
      const { matchedSkillIds, missingSkillIds, matchPercentage } = scoreAnalysis(
        requiredSkillIds,
        body.candidateSkillIds,
      );

      response.status(200).json({
        requiredSkillIds,
        matchedSkillIds,
        missingSkillIds,
        matchPercentage,
        evidence,
        versions: {
          catalog: options.catalog.version,
          extractor: EXTRACTOR_VERSION,
          scoring: SCORING_VERSION,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
