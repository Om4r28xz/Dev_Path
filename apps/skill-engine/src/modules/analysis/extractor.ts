import type { LoadedCatalog } from './catalog.js';

export const EXTRACTOR_VERSION = '1.1.0';

export interface SkillMatch {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

export interface SkillEvidence {
  readonly skillId: string;
  readonly matches: readonly SkillMatch[];
}

interface Candidate extends SkillMatch {
  readonly skillId: string;
}

const WORD_CHARACTER = /[\p{L}\p{N}_]/u;
const MAX_MATCHES_PER_SKILL = 20;

function normalizeWithOffsets(text: string): {
  text: string;
  starts: number[];
  ends: number[];
} {
  let normalized = '';
  const starts: number[] = [];
  const ends: number[] = [];
  const segments = new Intl.Segmenter('und', { granularity: 'grapheme' }).segment(text);
  for (const { segment, index } of segments) {
    const folded = segment.normalize('NFKC');
    normalized += folded;
    for (let i = 0; i < folded.length; i++) {
      starts.push(index);
      ends.push(index + segment.length);
    }
  }
  return { text: normalized, starts, ends };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasTokenBoundaries(text: string, start: number, end: number): boolean {
  const previousOffset =
    start > 1 && /[\uDC00-\uDFFF]/u.test(text[start - 1]!) ? start - 2 : start - 1;
  const before = start === 0 ? '' : String.fromCodePoint(text.codePointAt(previousOffset)!);
  const after = end === text.length ? '' : String.fromCodePoint(text.codePointAt(end)!);
  return !WORD_CHARACTER.test(before) && !WORD_CHARACTER.test(after);
}

function negatedRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const patterns = [
    /\bno\s+se\s+requiere(?:n)?\s+([^.!?;\n]+)/giu,
    /\bno\s+experience\s+with\s+([^.!?;\n]+?)\s+is\s+required\b/giu,
    /([\p{L}\p{N}+#.]+(?:\s+[\p{L}\p{N}+#.]+)?)\s+is\s+not\s+required\b/giu,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const body = match[1];
      if (body === undefined) continue;
      const bodyStart = match.index + match[0].indexOf(body);
      ranges.push({ start: bodyStart, end: bodyStart + body.length });
    }
  }

  return ranges;
}

export function extractSkills(jobText: string, catalog: LoadedCatalog): SkillEvidence[] {
  const candidates: Candidate[] = [];
  const excluded = negatedRanges(jobText);
  const normalized = normalizeWithOffsets(jobText);

  for (const entry of catalog.entries) {
    for (const alias of entry.aliases) {
      // Catalog values are literal names, never executable regular expressions.
      const pattern = new RegExp(escapeRegex(alias.normalize('NFKC')), 'giu');
      for (const match of normalized.text.matchAll(pattern)) {
        const normalizedEnd = match.index + match[0].length;
        if (!hasTokenBoundaries(normalized.text, match.index, normalizedEnd)) continue;
        const start = normalized.starts[match.index]!;
        const end = normalized.ends[normalizedEnd - 1]!;
        if (excluded.some((range) => start >= range.start && end <= range.end)) continue;
        candidates.push({ skillId: entry.id, text: jobText.slice(start, end), start, end });
      }
    }
  }

  // Prefer the most specific alias at an offset; a shorter alias inside it
  // must not imply another technology (React Native, JavaScript, Node.js).
  candidates.sort(
    (a, b) => a.start - b.start || b.end - a.end || a.skillId.localeCompare(b.skillId),
  );
  const selected: Candidate[] = [];
  for (const candidate of candidates) {
    const last = selected[selected.length - 1];
    if (last !== undefined && candidate.start < last.end) continue;
    selected.push(candidate);
  }

  const bySkill = new Map<string, SkillMatch[]>();
  for (const match of selected) {
    const matches = bySkill.get(match.skillId) ?? [];
    if (matches.length >= MAX_MATCHES_PER_SKILL) continue;
    matches.push({ text: match.text, start: match.start, end: match.end });
    bySkill.set(match.skillId, matches);
  }

  return [...bySkill.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([skillId, matches]) => ({ skillId, matches }));
}
