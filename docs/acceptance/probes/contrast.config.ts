import { defineConfig } from '@playwright/test';
import base from './readiness.config.js';
export default defineConfig({ ...base, testMatch: 'contrast.browser.spec.ts' });
