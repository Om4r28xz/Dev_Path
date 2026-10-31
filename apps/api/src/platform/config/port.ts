export function readPort(rawValue: string | undefined, fallback: number): number {
  if (rawValue === undefined || rawValue.trim() === '') {
    return fallback;
  }

  const port = Number(rawValue);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }

  return port;
}
