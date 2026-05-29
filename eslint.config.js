import eslintConfigNext from 'eslint-config-next';

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', '.claude/**', 'playwright.config.ts', 'tests/**'],
  },
  ...eslintConfigNext,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-page-custom-font': 'off',
    },
  },
];

export default config;
