import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const PRIMEREACT = {
  group: ['primereact', 'primereact/*'],
  message: 'Import from @verity/design-system. PrimeReact is an implementation detail of the design system.',
};
const OTHER_APPS = {
  group: ['@verity/shell', '@verity/shell/*', '@verity/review-list', '@verity/review-list/*', '@verity/doc-viewer', '@verity/doc-viewer/*'],
  message: 'Micro frontends integrate only through @verity/contracts (props + events), never by importing each other.',
};

export default defineConfig(
  {
    ignores: ['**/dist/**', '**/storybook-static/**', '**/src/generated/**', '**/.__mf__temp/**', '**/playwright-report/**', '**/test-results/**', '**/coverage/**'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Governance: product code goes through the design system and the contract.
  {
    files: ['apps/shell/**/*.{ts,tsx}', 'apps/mock-api/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [PRIMEREACT] }] },
  },
  {
    files: ['apps/review-list/**/*.{ts,tsx}', 'apps/doc-viewer/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [PRIMEREACT, OTHER_APPS] }] },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.stories.tsx', 'e2e/**/*.ts'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
);
