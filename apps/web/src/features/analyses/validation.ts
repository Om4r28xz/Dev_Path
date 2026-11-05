import type { Analysis } from './types.js';

export class AnalysisResponseError extends Error {
  constructor() {
    super('La respuesta del análisis no es válida.');
  }
}
const invalid = (): never => {
  throw new AnalysisResponseError();
};
function object(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !allowed.includes(key))
  )
    return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) return invalid();
  return value;
}
function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    return invalid();
  return value;
}
function skillId(value: unknown): string {
  const id = text(value, 64);
  if (!/^[a-z][a-z0-9-]*$/u.test(id)) return invalid();
  return id;
}
function ids(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 100) return invalid();
  const result = value.map(skillId);
  if (new Set(result).size !== result.length) return invalid();
  return result;
}
function version(value: unknown): string {
  if (typeof value !== 'string' || !/^\d+\.\d+\.\d+$/u.test(value)) return invalid();
  return value;
}
function evidence(value: unknown, required: readonly string[]): NonNullable<Analysis['evidence']> {
  if (!Array.isArray(value) || value.length > 100 || value.length !== required.length)
    return invalid();
  const seen = new Set<string>();
  return value.map((item) => {
    const group = object(item, ['skillId', 'matches']);
    const id = skillId(group.skillId);
    if (
      seen.has(id) ||
      !required.includes(id) ||
      !Array.isArray(group.matches) ||
      group.matches.length < 1 ||
      group.matches.length > 20
    )
      return invalid();
    seen.add(id);
    const ranges = new Set<string>();
    const matches = group.matches.map((item) => {
      const match = object(item, ['text', 'start', 'end']);
      const mention = text(match.text, 100);
      const start = integer(match.start, 0, 19999),
        end = integer(match.end, 1, 20000);
      const range = `${start}:${end}`;
      if (end <= start || end - start !== mention.length || ranges.has(range)) return invalid();
      ranges.add(range);
      return { text: mention, start, end };
    });
    return { skillId: id, matches };
  });
}
export function parseAnalysis(value: unknown): Analysis {
  const raw = object(value, [
    'id',
    'source',
    'candidateSkillsRevision',
    'requiredSkillIds',
    'matchedSkillIds',
    'missingSkillIds',
    'compatibilityPercentage',
    'versions',
    'warnings',
    'skillsOutdated',
    'createdAt',
    'evidence',
  ]);
  const id = text(raw.id, 36);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/iu.test(id))
    return invalid();
  const rawSource =
    typeof raw.source === 'object' && raw.source !== null && !Array.isArray(raw.source)
      ? (raw.source as Record<string, unknown>)
      : invalid();
  let parsedSource: Analysis['source'];
  if (rawSource.type === 'text') {
    const source = object(raw.source, ['type', 'title']);
    const title = source.title === null ? null : text(source.title, 120);
    parsedSource = { type: 'text', title };
  } else if (rawSource.type === 'jsearch') {
    const source = object(raw.source, ['type', 'title', 'providerId']);
    const title = source.title === null ? null : text(source.title, 120);
    const providerId = text(source.providerId, 512);
    if (/[\r\n]/u.test(providerId) || /^[a-z][a-z0-9+.-]*:\/\//iu.test(providerId)) {
      return invalid();
    }
    parsedSource = { type: 'jsearch', title, providerId };
  } else {
    return invalid();
  }
  const required = ids(raw.requiredSkillIds),
    matched = ids(raw.matchedSkillIds),
    missing = ids(raw.missingSkillIds);
  if (
    matched.some((id) => !required.includes(id) || missing.includes(id)) ||
    missing.some((id) => !required.includes(id)) ||
    matched.length + missing.length !== required.length
  )
    return invalid();
  const percentage =
    raw.compatibilityPercentage === null ? null : integer(raw.compatibilityPercentage, 0, 100);
  if (
    percentage !== (required.length ? Math.round((100 * matched.length) / required.length) : null)
  )
    return invalid();
  const versions = object(raw.versions, ['catalog', 'extractor', 'scoring']);
  if (
    !Array.isArray(raw.warnings) ||
    raw.warnings.length > 20 ||
    typeof raw.skillsOutdated !== 'boolean'
  )
    return invalid();
  const createdAt = text(raw.createdAt, 64);
  if (
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/u.test(createdAt) ||
    !Number.isFinite(Date.parse(createdAt))
  )
    return invalid();
  const result: Analysis = {
    id,
    source: parsedSource,
    candidateSkillsRevision: integer(raw.candidateSkillsRevision, 0, Number.MAX_SAFE_INTEGER),
    requiredSkillIds: required,
    matchedSkillIds: matched,
    missingSkillIds: missing,
    compatibilityPercentage: percentage,
    versions: {
      catalog: version(versions.catalog),
      extractor: version(versions.extractor),
      scoring: version(versions.scoring),
    },
    warnings: raw.warnings.map((value) => text(value, 200)),
    skillsOutdated: raw.skillsOutdated,
    createdAt,
  };
  if (raw.evidence !== undefined) {
    try {
      const candidate = { ...result, evidence: evidence(raw.evidence, required) };
      if (new TextEncoder().encode(JSON.stringify(candidate)).byteLength <= 128 * 1024)
        return candidate;
    } catch (error) {
      if (!(error instanceof AnalysisResponseError)) throw error;
      // An optional malformed field cannot replace or invalidate a valid snapshot.
    }
  }
  return result;
}
