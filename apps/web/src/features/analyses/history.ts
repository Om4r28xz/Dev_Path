import type { InfiniteData } from '@tanstack/react-query';
import type {
  AnalysisListResponse,
  AnalysisSummary,
} from '../../../../../packages/contracts/src/public/generated.js';
export type { AnalysisListResponse, AnalysisSummary };
export type HistoryData = InfiniteData<AnalysisListResponse, string | null>;
export class HistoryResponseError extends Error {
  constructor() {
    super('La respuesta del historial no es válida.');
  }
}
const invalid = (): never => {
  throw new HistoryResponseError();
};
function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    return invalid();
  return value as Record<string, unknown>;
}
export function parseHistory(value: unknown): AnalysisListResponse {
  const raw = record(value, ['items', 'nextCursor']);
  const cursor = raw.nextCursor;
  if (cursor !== null && (typeof cursor !== 'string' || cursor.length < 16 || cursor.length > 512))
    return invalid();
  if (!Array.isArray(raw.items) || raw.items.length > 50) return invalid();
  const seen = new Set<string>();
  const items = raw.items.map((item): AnalysisSummary => {
    const row = record(item, [
      'id',
      'source',
      'compatibilityPercentage',
      'skillsOutdated',
      'createdAt',
    ]);
    const { id, compatibilityPercentage, skillsOutdated, createdAt } = row;
    if (
      typeof id !== 'string' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/iu.test(id) ||
      seen.has(id)
    )
      return invalid();
    seen.add(id);
    const source = record(row.source, ['type', 'title']);
    const title = source.title;
    if (
      source.type !== 'text' ||
      (title !== null && (typeof title !== 'string' || title.length < 1 || title.length > 120))
    )
      return invalid();
    if (
      compatibilityPercentage !== null &&
      (typeof compatibilityPercentage !== 'number' ||
        !Number.isInteger(compatibilityPercentage) ||
        compatibilityPercentage < 0 ||
        compatibilityPercentage > 100)
    )
      return invalid();
    if (
      typeof skillsOutdated !== 'boolean' ||
      typeof createdAt !== 'string' ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/u.test(createdAt) ||
      !Number.isFinite(Date.parse(createdAt))
    )
      return invalid();
    return {
      id,
      source: { type: 'text', title },
      compatibilityPercentage,
      skillsOutdated,
      createdAt,
    };
  });
  return { items, nextCursor: cursor };
}
export function historyItems(pages: readonly AnalysisListResponse[]): AnalysisSummary[] {
  const seen = new Set<string>();
  return pages.flatMap((page) =>
    page.items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }),
  );
}
export function removeHistoryItem(
  data: HistoryData | undefined,
  id: string,
): HistoryData | undefined {
  return (
    data && {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== id),
      })),
    }
  );
}
