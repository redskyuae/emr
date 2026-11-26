// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SignOutSync } from './sign-out-sync';

const { router, queryClient } = vi.hoisted(() => ({
  router: { replace: vi.fn(), refresh: vi.fn() },
  queryClient: { clear: vi.fn() },
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => queryClient }));

function broadcastFromAnotherTab(key: string, newValue: string | null) {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
}

describe('SignOutSync', () => {
  beforeEach(() => {
    window.sessionStorage.setItem('emr-tab-session', 'active');
    render(createElement(SignOutSync));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('should leave this tab when another tab signs out manually', () => {
    broadcastFromAnotherTab('emr-sign-out', JSON.stringify({ reason: 'manual', at: 1 }));

    expect(window.sessionStorage.getItem('emr-tab-session')).toBeNull();
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('should show the inactivity notice when another tab signed out after inactivity', () => {
    broadcastFromAnotherTab('emr-sign-out', JSON.stringify({ reason: 'idle', at: 1 }));

    expect(router.replace).toHaveBeenCalledWith('/login?reason=idle');
  });

  it('should ignore unrelated storage changes', () => {
    broadcastFromAnotherTab('emr-last-activity', '1234');
    broadcastFromAnotherTab('emr-sign-out', 'not-json');

    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem('emr-tab-session')).toBe('active');
  });
});
