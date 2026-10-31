import type { LoadedCatalog } from './catalog.js';

export const EXTRACTOR_VERSION = '1.0.0';

export interface SkillMatch {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

export interface SkillEvidence {
  readonly skillId: string;
  readonly matches: readonly SkillMatch[];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mergeOverlapping(matches: SkillMatch[]): SkillMatch[] {
  if (matches.length === 0) return [];

  const sorted = [...matches].sort((a, b) => a.start - b.start);
  const merged: SkillMatch[] = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;

    if (current.start < last.end) {
      // Overlapping — keep the one with the wider range (prefer already added)
      if (current.end > last.end) {
        merged[merged.length - 1] = { text: current.text, start: last.start, end: current.end };
      }
    } else {
      merged.push(current);
    }
  }

  return merged;
}

export function extractSkills(jobText: string, catalog: LoadedCatalog): SkillEvidence[] {
  const results: SkillEvidence[] = [];

  for (const entry of catalog.entries) {
    const rawMatches: SkillMatch[] = [];

    for (const alias of entry.aliases) {
      const pattern = new RegExp(escapeRegex(alias), 'gi');
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(jobText)) !== null) {
        rawMatches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }

    if (rawMatches.length === 0) continue;

    const deduped = mergeOverlapping(rawMatches);

    results.push({ skillId: entry.id, matches: deduped });
  }

  return results;
}
