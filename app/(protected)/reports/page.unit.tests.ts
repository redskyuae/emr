import { beforeEach, describe, expect, it, vi } from 'vitest';

import ReportsPage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('./_components/reports-page-impl', () => ({ ReportsPageImpl: () => null }));

describe('Reports demo gate', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return not found unless demo pages are enabled', () => {
    expect(() => ReportsPage()).toThrow('NEXT_NOT_FOUND');
  });

  it('should render when demo pages are enabled', () => {
    vi.stubEnv('ENABLE_DEMO_PAGES', 'true');

    expect(ReportsPage()).toBeTruthy();
  });
});
