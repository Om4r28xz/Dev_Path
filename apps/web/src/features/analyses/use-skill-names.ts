import { useQuery } from '@tanstack/react-query';
import { searchSkills } from '../skills/api.js';
export function useAnalysisSkillNames(owner: string): Record<string, string> {
  const catalog = useQuery({
    queryKey: ['analysis-catalog', owner],
    queryFn: ({ signal }) => searchSkills('', null, signal),
    retry: false,
  });
  return Object.fromEntries((catalog.data?.items ?? []).map((skill) => [skill.id, skill.name]));
}
