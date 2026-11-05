import { describe, expect, it } from 'vitest';
import { safeExternalResource } from './types.js';

describe('LRN-04 resource links', () => {
  it('allows only explicit HTTP(S) resources', () => {
    expect(safeExternalResource('https://example.org/learn')).toBe('https://example.org/learn');
    expect(safeExternalResource('http://example.org/learn')).toBe('http://example.org/learn');
    expect(safeExternalResource('javascript:alert(1)')).toBeNull();
    expect(safeExternalResource('not a url')).toBeNull();
    expect(safeExternalResource(null)).toBeNull();
  });
});
