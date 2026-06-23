import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: false,
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['**/*.unit.tests.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: ['**/*.integration.tests.ts'],
          setupFiles: ['./test/setup/integration.ts'],
          fileParallelism: false,
          poolOptions: { forks: { singleFork: true } },
        },
      },
    ],
  },
});
