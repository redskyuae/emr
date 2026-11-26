// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearLastActivity, LAST_ACTIVITY_KEY } from '@/app/lib/idle-session';

import { OnboardingPageImpl } from './onboarding-page-impl';

const { onboard } = vi.hoisted(() => ({
  onboard: { onSuccess: () => {} },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/components/ui/multi-step-loader', () => ({ MultiStepLoader: () => null }));
vi.mock('@/app/queries/auth/useOnboardTenant', () => ({
  useOnboardTenant: (options: { onSuccess: () => void }) => {
    onboard.onSuccess = options.onSuccess;

    return { mutate: vi.fn(), isError: false, error: null };
  },
}));

describe('OnboardingPageImpl idle activity on completion', () => {
  beforeEach(() => {
    clearLastActivity();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should record a fresh activity time when idle timeout is enabled', () => {
    const before = Date.now();
    render(createElement(OnboardingPageImpl, { tenantName: 'Apollo', trackIdleActivity: true }));

    onboard.onSuccess();

    expect(Number(window.localStorage.getItem(LAST_ACTIVITY_KEY))).toBeGreaterThanOrEqual(before);
  });

  it('should record nothing when idle timeout is disabled', () => {
    render(createElement(OnboardingPageImpl, { tenantName: 'Apollo', trackIdleActivity: false }));

    onboard.onSuccess();

    expect(window.localStorage.getItem(LAST_ACTIVITY_KEY)).toBeNull();
  });
});
