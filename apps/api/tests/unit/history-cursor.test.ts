import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  decodeHistoryCursor,
  encodeHistoryCursor,
  historyQuerySchema,
} from '../../src/modules/analyses/history-cursor.js';
const owner = randomUUID();
const id = randomUUID();
const time = '2026-11-01T12:00:00.123456Z';
describe('ANL-03 opaque keyset cursor', () => {
  it('round-trips exact microseconds and defaults to20', () => {
    expect(historyQuerySchema.parse({}).limit).toBe(20);
    const token = encodeHistoryCursor(owner, time, id);
    expect(token.length).toBeGreaterThanOrEqual(16);
    expect(token.length).toBeLessThanOrEqual(512);
    expect(decodeHistoryCursor(token, owner)).toEqual({ v: 1, owner, createdAt: time, id });
  });
  it.each(['0', '51', '-1', '1.5', 'NaN', '0x14', '1e1', '', ' 2'])(
    'rejects invalid limit %s',
    (limit) => expect(historyQuerySchema.safeParse({ limit }).success).toBe(false),
  );
  it('rejects foreign, invalid, unknown-version, noncanonical and invalid-date cursors', () => {
    const token = encodeHistoryCursor(owner, time, id);
    expect(() => decodeHistoryCursor(token, randomUUID())).toThrow();
    for (const raw of [
      'garbage',
      'a'.repeat(513),
      token + '=',
      Buffer.from(JSON.stringify({ v: 2, owner, createdAt: time, id })).toString('base64url'),
      Buffer.from(
        JSON.stringify({ v: 1, owner, createdAt: '2026-02-30T12:00:00.123456Z', id }),
      ).toString('base64url'),
      Buffer.from(JSON.stringify({ v: 1, owner, createdAt: time, id, extra: true })).toString(
        'base64url',
      ),
    ])
      expect(() => decodeHistoryCursor(raw, owner)).toThrow();
    expect(historyQuerySchema.safeParse({ limit: ['1', '2'] }).success).toBe(false);
    expect(historyQuerySchema.safeParse({ userId: owner }).success).toBe(false);
  });
});
