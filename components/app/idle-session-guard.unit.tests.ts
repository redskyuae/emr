// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ComponentProps, createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearLastActivity, LAST_ACTIVITY_KEY, recordActivity } from '@/app/lib/idle-session';

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

// Stands in for a protected page with an open patient form.
const app = createElement(
  'form',
  null,
  createElement('button', { type: 'submit' }, 'Save Patient')
);

function mountGuard() {
  // createElement supplies `children` from its third argument.
  const props = { timeoutMinutes: TIMEOUT_MINUTES } as ComponentProps<typeof IdleSessionGuard>;

  render(createElement(IdleSessionGuard, props, app));
}

function failSignOut() {
  signOut.mockImplementation((_variables, options?: { onError?: () => void }) =>
    options?.onError?.()
  );
}

describe('IdleSessionGuard on mount', () => {
  beforeEach(() => {
    clearLastActivity();
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
    expect(signOut).toHaveBeenCalledWith('idle_timeout', expect.anything());
    expect(window.localStorage.getItem(LAST_ACTIVITY_KEY)).toBe(stored);
    expect(window.sessionStorage.getItem('emr-tab-session')).toBeNull();
  });

  it('should keep a recent stored activity time instead of resetting it', () => {
    const stored = storeLastActivity(2);

    mountGuard();

    expect(signOut).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(LAST_ACTIVITY_KEY)).toBe(stored);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Save Patient' })).toBeTruthy();
  });

  it('should show the warning straight away when a reload lands inside the warning period', () => {
    storeLastActivity(TIMEOUT_MINUTES - 0.5);

    mountGuard();

    expect(signOut).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText('Your Session is about to expire')).toBeTruthy();
  });

  it('should record Logout Now as a sign-out by the user', () => {
    storeLastActivity(TIMEOUT_MINUTES - 0.5);

    mountGuard();
    fireEvent.click(screen.getByRole('button', { name: 'Logout Now' }));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith('user', expect.anything());
  });

  it('should sign out when no activity was recorded since the last sign-out', () => {
    mountGuard();

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

describe('IdleSessionGuard when localStorage refuses writes', () => {
  beforeEach(() => {
    clearLastActivity();
    window.localStorage.clear();
    window.sessionStorage.setItem('emr-tab-session', 'active');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  function failStorageWrites() {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    });
  }

  it('should keep the user signed in after login when the fresh time cannot be stored', () => {
    failStorageWrites();

    // What the login form does right after sign-in.
    recordActivity(Date.now());
    mountGuard();

    expect(window.localStorage.getItem(LAST_ACTIVITY_KEY)).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save Patient' })).toBeTruthy();
  });

  it('should still sign out when the in-memory time is past the timeout', () => {
    failStorageWrites();

    recordActivity(Date.now() - (TIMEOUT_MINUTES + 1) * MINUTE);
    mountGuard();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Save Patient' })).toBeNull();
  });

  it('should still sign out when nothing was recorded in this tab or storage', () => {
    failStorageWrites();

    mountGuard();

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

describe('IdleSessionGuard after the Session expires', () => {
  beforeEach(() => {
    clearLastActivity();
    window.localStorage.clear();
    storeLastActivity(TIMEOUT_MINUTES + 1);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    signOut.mockReset();
  });

  it('should unmount the app while the sign-out request is in flight', () => {
    mountGuard();

    expect(screen.queryByRole('button', { name: 'Save Patient' })).toBeNull();
    expect(screen.getByText('Signing out')).toBeTruthy();
  });

  it('should keep the app unmounted and offer Try again when sign-out fails', () => {
    failSignOut();

    mountGuard();

    expect(screen.queryByRole('button', { name: 'Save Patient' })).toBeNull();
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByText(/couldn't end your Session on the server/)).toBeTruthy();
  });

  it('should stay blocked through failed retries until sign-out succeeds', () => {
    failSignOut();
    mountGuard();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(signOut).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole('button', { name: 'Save Patient' })).toBeNull();
    expect(screen.getByText(/couldn't end your Session on the server/)).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
