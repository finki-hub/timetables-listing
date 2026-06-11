import {
  base,
  browser,
  perfectionist,
  prettier,
  react,
  typescript,
} from 'eslint-config-imperium';

const config = [
  { ignores: ['dist'] },
  ...base,
  browser,
  react,
  typescript,
  prettier,
  perfectionist,
];

export default config;
