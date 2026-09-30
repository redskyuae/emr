import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearTabSession, hasTabSession, markTabSession } from './tab-session';

describe('tab Session marker', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('should keep access in the current tab while a fresh tab has none', () => {
    expect(hasTabSession()).toBe(false);
    expect(markTabSession()).toBe(true);
    expect(hasTabSession()).toBe(true);

    const firstTab = window;
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: () => null,
      },
    });
    expect(hasTabSession()).toBe(false);

    vi.stubGlobal('window', firstTab);
    expect(hasTabSession()).toBe(true);
  });

  it('should remove tab access after sign-out', () => {
    markTabSession();
    clearTabSession();

    expect(hasTabSession()).toBe(false);
  });

  it('should fail closed when tab storage is unavailable', () => {
    vi.stubGlobal('window', {
      get sessionStorage() {
        throw new Error('Storage blocked');
      },
    });

    expect(hasTabSession()).toBe(false);
    expect(markTabSession()).toBe(false);
    expect(() => clearTabSession()).not.toThrow();
  });
});
