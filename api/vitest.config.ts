import { resolve } from 'node:path';

export default function createConfig() {
  return {
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, 'src'),
      },
    },
  };
}
