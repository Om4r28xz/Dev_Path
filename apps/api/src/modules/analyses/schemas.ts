import { z } from 'zod';
export const createAnalysisSchema = z
  .object({
    source: z
      .object({
        type: z.literal('text'),
        title: z
          .string()
          .min(1)
          .max(120)
          .refine((value) => value.trim().length > 0)
          .optional(),
        text: z
          .string()
          .min(1)
          .max(20000)
          .refine((value) => value.trim().length > 0),
      })
      .strict(),
  })
  .strict();
export type AnalysisCommand = z.infer<typeof createAnalysisSchema>;
const id = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9-]*$/u);
const ids = z
  .array(id)
  .max(100)
  .refine((values) => new Set(values).size === values.length);
const version = z.string().regex(/^\d+\.\d+\.\d+$/u);
export const engineResultSchema = z
  .object({
    requiredSkillIds: ids,
    matchedSkillIds: ids,
    missingSkillIds: ids,
    matchPercentage: z.number().int().min(0).max(100).nullable(),
    versions: z.object({ catalog: version, extractor: version, scoring: version }).strict(),
    evidence: z
      .array(
        z
          .object({
            skillId: id,
            matches: z
              .array(
                z
                  .object({
                    text: z.string().min(1).max(100),
                    start: z.number().int().min(0),
                    end: z.number().int().min(1),
                  })
                  .strict(),
              )
              .min(1)
              .max(20),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();
export type EngineResult = z.infer<typeof engineResultSchema>;
export interface EngineInput {
  catalogVersion: string;
  jobText: string;
  candidateSkillIds: string[];
}
export const CATALOG_VERSION = '1.0.0';
export function validInvariants(
  result: EngineResult,
  input: EngineInput,
  knownIds: ReadonlySet<string>,
): boolean {
  const required = new Set(result.requiredSkillIds);
  const candidate = new Set(input.candidateSkillIds);
  const sorted = (values: readonly string[]) => [...values].sort().join(',');
  const matched = result.requiredSkillIds.filter((id) => candidate.has(id));
  const missing = result.requiredSkillIds.filter((id) => !candidate.has(id));
  return (
    result.versions.catalog === input.catalogVersion &&
    result.requiredSkillIds.every((id) => knownIds.has(id)) &&
    sorted(result.matchedSkillIds) === sorted(matched) &&
    sorted(result.missingSkillIds) === sorted(missing) &&
    result.matchPercentage ===
      (required.size === 0 ? null : Math.round((100 * matched.length) / required.size)) &&
    result.evidence.length === required.size &&
    new Set(result.evidence.map((item) => item.skillId)).size === required.size &&
    result.evidence.every(
      (item) =>
        required.has(item.skillId) &&
        item.matches.every(
          (match) =>
            match.start < match.end &&
            match.end <= input.jobText.length &&
            input.jobText.slice(match.start, match.end) === match.text,
        ),
    )
  );
}
