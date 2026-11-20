// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LAST_ACTIVITY_KEY } from '@/app/lib/idle-session';

import { IdleSessionGuard } from './idle-session-guard';

const { signOut, router, queryClient } = vi.hoisted(() => ({
  signOut: vi.fn(),
  router: { replace: vi.fn(), refresh: vi.fn() },
  queryClient: { clear: vi.fn() },
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => queryClient }));
vi.mock('@/app/queries/auth/useSignOut', () => ({
  useSignOut: () => ({ mutate: signOut, isError: false, isPending: false }),
}));

const MINUTE = 60_000;
const TIMEOUT_MINUTES = 10;

function storeLastActivity(minutesAgo: number) {
  const at = Date.now() - minutesAgo * MINUTE;
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(at));

  return String(at);
}

function mountGuard() {
  render(createElement(IdleSessionGuard, { timeoutMinutes: TIMEOUT_MINUTES }));
}

describe('IdleSessionGuard on mount', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.setItem('emr-tab-session', 'active');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('should sign out at once when a reload finds activity older than the timeout', () => {
    const stored = storeLastActivity(TIMEOUT_MINUTES + 50);

    mountGuard();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(LAST_ACTIVITY_KEY)).toBe(stored);
    expect(window.sessionStorage.getItem('emr-tab-session')).toBeNull();
  });

  it('should keep a recent stored activity time instead of resetting it', () => {
    const stored = storeLastActivity(2);

    mountGuard();

    expect(signOut).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(LAST_ACTIVITY_KEY)).toBe(stored);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('should show the warning straight away when a reload lands inside the warning period', () => {
    storeLastActivity(TIMEOUT_MINUTES - 0.5);

    mountGuard();

    expect(signOut).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText('Your Session is about to expire')).toBeTruthy();
  });

  it('should sign out when no activity was recorded since the last sign-out', () => {
    mountGuard();

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
