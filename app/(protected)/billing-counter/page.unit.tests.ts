import { beforeEach, describe, expect, it, vi } from 'vitest';

import BillingCounterPage from './page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('./_components/billing-counter-page-impl', () => ({ BillingCounterPageImpl: () => null }));

describe('Billing Counter demo gate', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return not found unless demo pages are enabled', () => {
    expect(() => BillingCounterPage()).toThrow('NEXT_NOT_FOUND');
  });

  it('should render when demo pages are enabled', () => {
    vi.stubEnv('ENABLE_DEMO_PAGES', 'true');

    expect(BillingCounterPage()).toBeTruthy();
  });
});
