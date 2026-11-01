import { ApiError } from '../../lib/http/client.js';

export interface LoginFields {
  email: string;
  password: string;
}
export interface RegisterFields extends LoginFields {
  name: string;
}
export type FieldErrors<T> = Partial<Record<keyof T, string | undefined>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function validateLogin(fields: LoginFields): FieldErrors<LoginFields> {
  const errors: FieldErrors<LoginFields> = {};
  const email = fields.email.trim();
  if (!email || email.length > 254 || !emailPattern.test(email))
    errors.email = 'Escribe un correo electrónico válido.';
  if (!fields.password || fields.password.length > 128)
    errors.password = 'Escribe tu contraseña (máximo 128 caracteres).';
  return errors;
}

export function validateRegister(fields: RegisterFields): FieldErrors<RegisterFields> {
  const errors: FieldErrors<RegisterFields> = validateLogin(fields);
  const name = fields.name.trim();
  if (!name || name.length > 100) errors.name = 'Escribe tu nombre (máximo 100 caracteres).';
  if (fields.password.length < 12 || fields.password.length > 128)
    errors.password = 'Usa entre 12 y 128 caracteres.';
  return errors;
}

export function safeReturnTo(value: string | null, origin: string): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /^\/%(?:2f|5c)/iu.test(value) ||
    value.includes('\\') ||
    [...value].some((character) => character.charCodeAt(0) < 32)
  )
    return '/profile';
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || ['/login', '/register'].includes(url.pathname)) return '/profile';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/profile';
  }
}

export function authErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'No se pudo conectar. Inténtalo más tarde.';
  if (error.status === 401) return 'El correo o la contraseña no son correctos.';
  if (error.status === 409) return 'Ese correo ya está registrado.';
  if (error.status === 429) return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
  if (error.status === 503) return 'El servicio no está disponible. Inténtalo más tarde.';
  return 'No se pudo completar la solicitud. Revisa los datos e inténtalo de nuevo.';
}
