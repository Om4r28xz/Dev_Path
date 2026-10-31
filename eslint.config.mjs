import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const databaseImportRestrictions = {
  paths: [
    {
      name: '@devpath/db',
      message: 'La web y el Skill Engine no pueden importar la capa de base de datos.',
    },
  ],
  patterns: [
    {
      group: ['@devpath/db/*'],
      message: 'La web y el Skill Engine no pueden importar la capa de base de datos.',
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': ['error', databaseImportRestrictions],
    },
  },
  {
    files: ['apps/skill-engine/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-restricted-imports': ['error', databaseImportRestrictions],
    },
  },
  {
    files: ['apps/api/**/*.ts', '**/*.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
