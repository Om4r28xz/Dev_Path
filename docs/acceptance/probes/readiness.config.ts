import { defineConfig } from '@playwright/test';
import base from '../../../playwright.config.js';

export default defineConfig({
  ...base,
  testDir: '.',
  testMatch: 'readiness.browser.spec.ts',
  timeout: 120000,
  reporter: [['list']],
});
