import { describe, expect, it } from 'vitest';
import { ApiError } from '../../lib/http/client.js';
import { authErrorMessage, safeReturnTo, validateLogin, validateRegister } from './form-utils.js';

describe('auth forms', () => {
  it('checks the public register limits and normalizes whitespace for validation', () => {
    expect(validateRegister({ name: ' ', email: 'bad', password: 'short' })).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      password: expect.any(String),
    });
    expect(
      validateRegister({ name: ' Ana ', email: ' ana@example.test ', password: 'a'.repeat(12) }),
    ).toEqual({});
  });

  it('accepts login passwords without imposing registration minimum', () => {
    expect(validateLogin({ email: 'a@example.test', password: 'old' })).toEqual({});
  });

  it.each([
    ['https://evil.example/', '/profile'],
    ['//evil.example/', '/profile'],
    ['///evil.example/', '/profile'],
    ['/%2F/evil.example/', '/profile'],
    ['/\\evil.example/', '/profile'],
    ['/login', '/profile'],
    ['/register', '/profile'],
    ['/analyses/123?tab=details#result', '/analyses/123?tab=details#result'],
  ])('keeps return target %s within the app', (input, expected) => {
    expect(safeReturnTo(input, 'http://127.0.0.1:5173')).toBe(expected);
  });

  it('shows generic credential, rate limit and outage messages', () => {
    expect(authErrorMessage(new ApiError(401, 'INVALID_CREDENTIALS', 'private', ''))).not.toContain(
      'private',
    );
    expect(authErrorMessage(new ApiError(429, 'RATE_LIMITED', '', ''))).toContain('intentos');
    expect(authErrorMessage(new ApiError(503, 'DEPENDENCY_UNAVAILABLE', '', ''))).toContain(
      'no está disponible',
    );
  });
});
