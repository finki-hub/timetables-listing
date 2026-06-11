import {
  base,
  node,
  perfectionist,
  prettier,
  typescript,
} from 'eslint-config-imperium';

const config = [
  { ignores: ['.wrangler', 'dist'] },
  ...base,
  node,
  typescript,
  prettier,
  perfectionist,
  {
    languageOptions: {
      globals: {
        caches: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];

export default config;
