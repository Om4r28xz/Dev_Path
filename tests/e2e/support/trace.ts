import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

/** Keep trace events and screenshots, discard all request/response body resources. */
export function sanitizeTrace(raw: Uint8Array, secrets: Iterable<string>): Uint8Array {
  const files = unzipSync(raw);
  const safe: Record<string, Uint8Array> = {};
  const values = [...secrets].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const [name, data] of Object.entries(files)) {
    if (name.endsWith('.trace') || name.endsWith('.network') || name.endsWith('.stacks')) {
      let text = strFromU8(data);
      for (const value of values) text = text.split(value).join('[REDACTED]');
      text = text.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]');
      // Header values may contain refresh cookies and must never leave the runner.
      text = text.replace(
        /("name"\s*:\s*"(?:authorization|cookie|set-cookie)"\s*,\s*"value"\s*:\s*)"(?:[^"\\]|\\.)*"/gi,
        '$1"[REDACTED]"',
      );
      safe[name] = strToU8(text);
    } else if (/^resources\/[\w-]+\.jpeg$/.test(name)) {
      // Screenshots contain synthetic fixture data; passwords use masked inputs.
      safe[name] = data;
    }
  }
  if (!Object.keys(safe).some((name) => name.endsWith('.trace')))
    throw Error('No trace events found; refusing to publish an unrecognized archive.');
  return zipSync(safe);
}
