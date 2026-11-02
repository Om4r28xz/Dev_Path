import { describe, expect, it } from 'vitest';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { sanitizeTrace } from './trace.js';

describe('failure trace privacy', () => {
  it('redacts credentials and drops response bodies without corrupting JSON events', () => {
    const password = 'Synthetic-password-123!';
    const jwt = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.signature';
    const raw = zipSync({
      '0.trace': strToU8(JSON.stringify({ value: password, token: jwt })),
      '0.network': strToU8(
        JSON.stringify({
          headers: [
            { name: 'Cookie', value: 'refresh=unknown-secret' },
            { name: 'Authorization', value: 'Bearer ' + jwt },
          ],
        }),
      ),
      'resources/body': strToU8('{"accessToken":"secret-body"}'),
      'resources/screenshot.jpeg': new Uint8Array([255, 216, 255]),
    });
    const safe = unzipSync(sanitizeTrace(raw, [password]));
    expect(JSON.parse(strFromU8(safe['0.trace']!))).toEqual({
      value: '[REDACTED]',
      token: '[REDACTED_JWT]',
    });
    expect(strFromU8(safe['0.network']!)).not.toContain('unknown-secret');
    expect(safe['resources/body']).toBeUndefined();
    expect(safe['resources/screenshot.jpeg']).toEqual(new Uint8Array([255, 216, 255]));
    expect(strFromU8(unzipSync(raw)['0.trace']!)).toContain(password);
  });
  it('fails closed on unrecognized or invalid archives', () => {
    expect(() => sanitizeTrace(zipSync({ secret: strToU8('secret') }), [])).toThrow();
    expect(() => sanitizeTrace(new Uint8Array([1, 2, 3]), [])).toThrow();
  });
});
