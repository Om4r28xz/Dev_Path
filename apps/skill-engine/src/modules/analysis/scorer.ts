export const SCORING_VERSION = '1.0.0';

export interface ScoreResult {
  readonly matchedSkillIds: string[];
  readonly missingSkillIds: string[];
  readonly matchPercentage: number | null;
}

export function scoreAnalysis(
  requiredSkillIds: string[],
  candidateSkillIds: string[],
): ScoreResult {
  const matchedSkillIds = requiredSkillIds.filter((id) => candidateSkillIds.includes(id));
  const missingSkillIds = requiredSkillIds.filter((id) => !candidateSkillIds.includes(id));
  const matchPercentage =
    requiredSkillIds.length === 0
      ? null
      : Math.round((100 * matchedSkillIds.length) / requiredSkillIds.length);

  return { matchedSkillIds, missingSkillIds, matchPercentage };
}
