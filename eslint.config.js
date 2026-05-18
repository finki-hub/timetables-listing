import {
  base,
  browser,
  perfectionist,
  prettier,
  typescript,
} from 'eslint-config-imperium';

const config = [
  { ignores: ['dist', 'public/timetables', '.playwright-mcp'] },
  ...base,
  browser,
  typescript,
  prettier,
  perfectionist,
  {
    files: ['src/**/*.test.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
    rules: {
      'max-nested-callbacks': 'off',
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
];

export default config;
