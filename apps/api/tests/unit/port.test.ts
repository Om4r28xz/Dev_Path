import { describe, expect, it } from 'vitest';

import { readPort } from '../../src/platform/config/port.js';

describe('readPort', () => {
  it('usa el puerto predeterminado cuando PORT no existe', () => {
    expect(readPort(undefined, 3000)).toBe(3000);
  });

  it('rechaza puertos fuera del rango permitido', () => {
    expect(() => readPort('70000', 3000)).toThrow('PORT debe ser un entero entre 1 y 65535.');
  });
});
