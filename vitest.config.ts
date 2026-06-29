import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: false,
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'unit',
          environment: 'node',
          include: ['**/*.unit.tests.ts'],
        },
      },
      {
        plugins: [tsconfigPaths()],
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
