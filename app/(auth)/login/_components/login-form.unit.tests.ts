// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearLastActivity, LAST_ACTIVITY_KEY } from '@/app/lib/idle-session';

import { LoginForm } from './login-form';

const { signIn } = vi.hoisted(() => ({
  signIn: { onSuccess: async () => {} },
}));

vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({}) }));
vi.mock('@/app/queries/identity-access/useCurrentUser', () => ({
  fetchCurrentUserHomePath: async () => '/dashboard',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/app/lib/tab-session', () => ({ markTabSession: () => true }));
vi.mock('@/lib/analytics/analytics-client', () => ({ captureAnalyticsEvent: vi.fn() }));
vi.mock('@/app/queries/auth/useSignOut', () => ({ useSignOut: () => ({ mutate: vi.fn() }) }));
vi.mock('@/app/queries/auth/useSignIn', () => ({
  useSignIn: (options: { onSuccess: () => Promise<void> }) => {
    signIn.onSuccess = options.onSuccess;

    return { mutate: vi.fn(), isPending: false, error: null, submittedAt: 0 };
  },
}));

describe('LoginForm idle activity on sign-in', () => {
  beforeEach(() => {
    clearLastActivity();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should record a fresh activity time when idle timeout is enabled', async () => {
    const before = Date.now();
    render(createElement(LoginForm, { trackIdleActivity: true }));

    await signIn.onSuccess();

    expect(Number(window.localStorage.getItem(LAST_ACTIVITY_KEY))).toBeGreaterThanOrEqual(before);
  });

  it('should record nothing when idle timeout is disabled', async () => {
    render(createElement(LoginForm, { trackIdleActivity: false }));

    await signIn.onSuccess();

    expect(window.localStorage.getItem(LAST_ACTIVITY_KEY)).toBeNull();
  });
});
