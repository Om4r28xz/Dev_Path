import { describe, expect, it } from 'vitest';

import { readPort } from '../../src/platform/config/port.js';

describe('readPort', () => {
  it('usa el puerto predeterminado cuando PORT no existe', () => {
    expect(readPort(undefined, 3001)).toBe(3001);
  });

  it('rechaza valores que no sean enteros', () => {
    expect(() => readPort('abc', 3001)).toThrow('PORT debe ser un entero entre 1 y 65535.');
  });
});
