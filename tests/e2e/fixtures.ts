import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sanitizeTrace } from './support/trace.js';

export interface User {
  id: string;
  token: string;
  email: string;
  password: string;
}
export interface App {
  pool: pg.Pool;
  register: (name: string) => Promise<User>;
  login: (user: User) => Promise<void>;
  call: (user: User, path: string, init?: RequestInit) => Promise<Response>;
  create: (title: string, text: string) => Promise<string>;
  engine: (action: 'start' | 'stop') => Promise<void>;
}
export const test = base.extend<{ app: App }>({
  app: async ({ page, context, baseURL }, use, info) => {
    if (!baseURL || !process.env.E2E_DATABASE_URL) throw Error('Run through pnpm test:e2e.');
    const pool = new pg.Pool({ connectionString: process.env.E2E_DATABASE_URL });
    const emails: string[] = [];
    const secrets = new Set<string>();
    const pending: Promise<void>[] = [];
    const collect = (response: import('@playwright/test').Response) => {
      if (!/\/auth\/(register|login|refresh)$/.test(new URL(response.url()).pathname)) return;
      pending.push(
        (async () => {
          try {
            const body = await response.json();
            if (typeof body.accessToken === 'string') secrets.add(body.accessToken);
            const cookies = await context.cookies();
            for (const cookie of cookies) secrets.add(cookie.value);
          } catch {
            /* Aborted auth responses have no usable credentials. */
          }
        })(),
      );
    };
    context.on('response', collect);
    await context.tracing.start({ screenshots: true, snapshots: false, sources: false });
    const engine = async (action: 'start' | 'stop') => {
      const response = await fetch(`${process.env.E2E_CONTROL_URL}/engine/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.E2E_CONTROL_TOKEN}` },
      });
      expect(response.status).toBe(204);
    };
    const register = async (name: string) => {
      const email = `e2e-${randomUUID()}@example.test`;
      const password = `Synthetic-${randomUUID()}!Aa1`;
      emails.push(email);
      secrets.add(password);
      await page.goto('/register');
      await page.getByLabel('Nombre completo').fill(name);
      await page.getByLabel('Correo electrónico').fill(email);
      await page.getByLabel(/^Contraseña/).fill(password);
      const response = page.waitForResponse(
        (r) => r.url().endsWith('/auth/register') && r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Registrarse', exact: true }).click();
      const result = await response;
      expect(result.status()).toBe(201);
      const session = await result.json();
      secrets.add(session.accessToken);
      await page.waitForURL('**/profile');
      return { id: session.user.id, token: session.accessToken, email, password };
    };
    const login = async (user: User) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(user.email);
      await page.getByLabel(/^Contraseña/).fill(user.password);
      const response = page.waitForResponse(
        (r) => r.url().endsWith('/auth/login') && r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      const result = await response;
      expect(result.status()).toBe(200);
      user.token = (await result.json()).accessToken;
      secrets.add(user.token);
      await page.waitForURL('**/profile');
    };
    const create = async (title: string, text: string) => {
      await page.goto('/analysis/new');
      await page.getByLabel('Título del puesto (opcional)').fill(title);
      await page.getByLabel('Texto de la vacante', { exact: true }).fill(text);
      await page.getByRole('button', { name: 'Analizar', exact: true }).click();
      await page.waitForURL(/\/analyses\/[a-f0-9-]+$/);
      await page.getByRole('heading', { name: 'Resultado del análisis', exact: true }).waitFor();
      return new URL(page.url()).pathname.split('/').at(-1)!;
    };
    try {
      await use({
        pool,
        register,
        login,
        create,
        engine,
        call: (user, path, init = {}) =>
          fetch(baseURL + '/api/v1' + path, {
            ...init,
            headers: { Authorization: `Bearer ${user.token}`, ...init.headers },
          }),
      });
    } finally {
      context.off('response', collect);
      await Promise.allSettled(pending);
      try {
        if (info.status !== info.expectedStatus) {
          const directory = await mkdtemp(join(tmpdir(), 'devpath-trace-'));
          try {
            const raw = join(directory, 'raw.zip');
            await context.tracing.stop({ path: raw });
            const path = info.outputPath('trace.safe.zip');
            await writeFile(path, sanitizeTrace(await readFile(raw), secrets));
            await info.attach('trace', { path, contentType: 'application/zip' });
          } finally {
            await rm(directory, { recursive: true });
          }
        } else await context.tracing.stop();
      } finally {
        try {
          await engine('start');
        } finally {
          try {
            await pool.query('DELETE FROM auth.users WHERE email = ANY($1::text[])', [emails]);
          } finally {
            await pool.end();
          }
        }
      }
    }
  },
});
export { expect };
export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.waitForURL('**/login');
}
