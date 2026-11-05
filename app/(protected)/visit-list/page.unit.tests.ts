import { beforeEach, describe, expect, it, vi } from 'vitest';

import VisitListPage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('./_components/visit-list-page-impl', () => ({ VisitListPageImpl: () => null }));

describe('Visit List demo gate', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return not found unless demo pages are enabled', () => {
    expect(() => VisitListPage()).toThrow('NEXT_NOT_FOUND');
  });

  it('should render when demo pages are enabled', () => {
    vi.stubEnv('ENABLE_DEMO_PAGES', 'true');

    expect(VisitListPage()).toBeTruthy();
  });
});
