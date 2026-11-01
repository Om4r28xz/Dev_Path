import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../../src/modules/auth/schemas/commands.js';
describe('AUTH-01 command validation', () => {
  it('preserves password whitespace and email dots/plus', () => {
    const parsed = registerSchema.parse({
      name: ' A ',
      email: ' A.B+tag@EXAMPLE.test ',
      password: ' 123456789012 ',
    });
    expect(parsed).toEqual({
      name: 'A',
      email: 'a.b+tag@example.test',
      password: ' 123456789012 ',
    });
  });
  it('enforces register and login bounds and strict fields', () => {
    const base = { name: 'A', email: 'a@example.test', password: 'x'.repeat(12) };
    expect(registerSchema.safeParse(base).success).toBe(true);
    for (const value of ['x'.repeat(11), 'x'.repeat(129)])
      expect(registerSchema.safeParse({ ...base, password: value }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, extra: 1 }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, name: '  ' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: base.email, password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: base.email, password: '' }).success).toBe(false);
  });
});
