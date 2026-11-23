import { configDefaults, defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Agent worktrees under .claude/ hold full checkouts of other branches; never run their tests.
const exclude = [...configDefaults.exclude, '.claude/**'];

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
          exclude,
          setupFiles: ['./test/setup/unit.ts'],
        },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'integration',
          environment: 'node',
          include: ['**/*.integration.tests.ts'],
          exclude,
          setupFiles: ['./test/setup/integration.ts'],
          testTimeout: 120_000,
          hookTimeout: 120_000,
          maxWorkers: 1,
          // Integration tests share one Postgres database and truncate it in a
          // beforeEach hook, so they must never run files concurrently.
          fileParallelism: false,
        },
      },
    ],
  },
});
