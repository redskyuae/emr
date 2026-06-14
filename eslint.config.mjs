import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  // Disable ESLint rules that would conflict with Prettier
  eslintConfigPrettier,
  // Vendored shadcn/ui registry code — keep upstream patterns intact
  {
    files: ['components/ui/**', 'hooks/use-mobile.ts'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

export default eslintConfig;
