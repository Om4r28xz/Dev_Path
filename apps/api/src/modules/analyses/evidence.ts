import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { engineResultSchema } from './schemas.js';

export const MAX_ANALYSIS_RESPONSE_BYTES = 128 * 1024;
const catalogSchema = z.object({
  version: z.string(),
  technologies: z.array(
    z.object({
      id: z.string(),
      aliases: z.array(z.object({ value: z.string() })),
    }),
  ),
});
// Use the canonical catalog, not a second hard-coded alias list. Historical
// versions not available in this checkout deliberately have no public evidence.
const catalog = catalogSchema.parse(
  JSON.parse(
    readFileSync(
      new URL('../../../../../packages/catalog/technologies.json', import.meta.url),
      'utf8',
    ),
  ),
);
const fold = (value: string) => value.normalize('NFKC').toLowerCase();
const aliases = new Map(
  catalog.technologies.map((skill) => [
    skill.id,
    new Set(skill.aliases.map((alias) => fold(alias.value))),
  ]),
);
interface PublicSnapshot {
  requiredSkillIds: readonly string[];
  versions: { catalog: string };
}
export function withStoredEvidence<T extends PublicSnapshot>(
  dto: T,
  stored: unknown,
  source: unknown,
): T & { evidence?: z.infer<typeof engineResultSchema>['evidence'] } {
  if (
    dto.versions.catalog !== catalog.version ||
    typeof source !== 'string' ||
    source.length > 20000
  )
    return dto;
  // Bound traversal before Zod visits historical arrays of untrusted size.
  if (
    !Array.isArray(stored) ||
    stored.length > 100 ||
    stored.some(
      (group) =>
        typeof group !== 'object' ||
        group === null ||
        !('matches' in group) ||
        !Array.isArray(group.matches) ||
        group.matches.length > 20,
    )
  )
    return dto;
  const parsed = engineResultSchema.shape.evidence.safeParse(stored);
  if (!parsed.success) return dto;
  const required = new Set(dto.requiredSkillIds);
  if (required.size !== dto.requiredSkillIds.length || parsed.data.length !== required.size)
    return dto;
  const seen = new Set<string>();
  for (const group of parsed.data) {
    if (!required.has(group.skillId) || seen.has(group.skillId)) return dto;
    seen.add(group.skillId);
    const allowed = aliases.get(group.skillId);
    if (!allowed) return dto;
    const ranges = new Set<string>();
    for (const match of group.matches) {
      const range = `${match.start}:${match.end}`;
      if (
        ranges.has(range) ||
        match.start >= match.end ||
        match.end > source.length ||
        source.slice(match.start, match.end) !== match.text ||
        !allowed.has(fold(match.text))
      )
        return dto;
      ranges.add(range);
    }
  }
  // Rebuild from parsed allowed fields; never serialize the row or source.
  const result = { ...dto, evidence: parsed.data };
  return Buffer.byteLength(JSON.stringify(result), 'utf8') <= MAX_ANALYSIS_RESPONSE_BYTES
    ? result
    : dto;
}
