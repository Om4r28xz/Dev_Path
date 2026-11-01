export const SCORING_VERSION = '1.1.0';

export interface ScoreResult {
  readonly matchedSkillIds: string[];
  readonly missingSkillIds: string[];
  readonly matchPercentage: number | null;
}

export function scoreAnalysis(
  requiredSkillIds: string[],
  candidateSkillIds: string[],
): ScoreResult {
  const required = [...new Set(requiredSkillIds)];
  const candidate = new Set(candidateSkillIds);
  const matchedSkillIds = required.filter((id) => candidate.has(id));
  const missingSkillIds = required.filter((id) => !candidate.has(id));
  const matchPercentage =
    required.length === 0 ? null : Math.round((100 * matchedSkillIds.length) / required.length);

  return { matchedSkillIds, missingSkillIds, matchPercentage };
}
