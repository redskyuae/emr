import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  broadcastSignOut,
  clearLastActivity,
  getStartingActivity,
  getIdleSignOutMessage,
  getIdleState,
  getSignedOutPath,
  IDLE_WARNING_MS,
  LAST_ACTIVITY_KEY,
  parseIdleTimeoutMinutes,
  MAX_IDLE_TIMEOUT_MINUTES,
  readLastActivity,
  readSignOutBroadcast,
  recordActivity,
} from './idle-session';

const TEN_MINUTES = 10 * 60_000;

describe('idle timeout configuration', () => {
  it('should default to 10 minutes when the value is missing', () => {
    expect(parseIdleTimeoutMinutes(undefined)).toBe(10);
    expect(parseIdleTimeoutMinutes('')).toBe(10);
  });

  it('should accept a valid custom timeout', () => {
    expect(parseIdleTimeoutMinutes('15')).toBe(15);
  });

  it('should fall back to the default for invalid input', () => {
    expect(parseIdleTimeoutMinutes('abc')).toBe(10);
    expect(parseIdleTimeoutMinutes('Infinity')).toBe(10);
    expect(parseIdleTimeoutMinutes('2.5')).toBe(10);
  });

  it('should fall back to the default for a negative value', () => {
    expect(parseIdleTimeoutMinutes('-5')).toBe(10);
  });

  it('should fall back to the default for zero', () => {
    expect(parseIdleTimeoutMinutes('0')).toBe(10);
  });

  it('should fall back to the default when the timeout is not longer than the warning', () => {
    expect(parseIdleTimeoutMinutes('1')).toBe(10);
    expect(parseIdleTimeoutMinutes('2')).toBe(2);
  });

  it('should fall back to the default for a value above the 24-hour maximum', () => {
    expect(parseIdleTimeoutMinutes(String(MAX_IDLE_TIMEOUT_MINUTES + 1))).toBe(10);
    expect(parseIdleTimeoutMinutes('100000')).toBe(10);
  });

  it('should accept the 24-hour maximum and keep its timer delay within the browser limit', () => {
    expect(MAX_IDLE_TIMEOUT_MINUTES).toBe(1440);
    expect(parseIdleTimeoutMinutes('1440')).toBe(1440);
    expect(MAX_IDLE_TIMEOUT_MINUTES * 60_000).toBeLessThan(2 ** 31 - 1);
  });
});

describe('idle state', () => {
  const last = 1_000_000;

  it('should stay active until the warning starts one minute before the timeout', () => {
    expect(getIdleState(last, last, TEN_MINUTES)).toEqual({
      status: 'active',
      warnAt: last + TEN_MINUTES - IDLE_WARNING_MS,
    });
    expect(getIdleState(last, last + 9 * 60_000 - 1, TEN_MINUTES).status).toBe('active');
  });

  it('should warn from 9 minutes until 10 minutes of inactivity', () => {
    expect(getIdleState(last, last + 9 * 60_000, TEN_MINUTES)).toEqual({
      status: 'warning',
      expiresAt: last + TEN_MINUTES,
    });
    expect(getIdleState(last, last + TEN_MINUTES - 1, TEN_MINUTES).status).toBe('warning');
  });

  it('should expire at the timeout and long after it, such as after laptop sleep', () => {
    expect(getIdleState(last, last + TEN_MINUTES, TEN_MINUTES)).toEqual({ status: 'expired' });
    expect(getIdleState(last, last + 5 * 60 * 60_000, TEN_MINUTES)).toEqual({
      status: 'expired',
    });
  });
});

describe('shared activity and sign-out storage', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
    // Resets this module's in-memory time between tests.
    clearLastActivity();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('should share the last activity time and nothing else', () => {
    expect(readLastActivity()).toBeNull();

    recordActivity(1234);

    expect(readLastActivity()).toBe(1234);
    expect([...values.keys()]).toEqual([LAST_ACTIVITY_KEY]);
  });

  it('should ignore a corrupt activity value', () => {
    values.set(LAST_ACTIVITY_KEY, 'not-a-time');

    expect(readLastActivity()).toBeNull();
  });

  it('should start the idle clock from the stored time, not the load time', () => {
    values.set(LAST_ACTIVITY_KEY, '1000');

    expect(getStartingActivity(999_999)).toBe(1000);
    expect(values.get(LAST_ACTIVITY_KEY)).toBe('1000');
  });

  it('should start the idle clock now and store it when no time was recorded', () => {
    expect(getStartingActivity(999_999)).toBe(999_999);
    expect(values.get(LAST_ACTIVITY_KEY)).toBe('999999');
  });

  it('should keep the stored start on a later load instead of restarting the clock', () => {
    getStartingActivity(1000);

    expect(getStartingActivity(999_999)).toBe(1000);
  });

  it('should start the idle clock now when the stored time is unreadable', () => {
    values.set(LAST_ACTIVITY_KEY, 'not-a-time');

    expect(getStartingActivity(999_999)).toBe(999_999);
  });

  it('should remove the stored time on sign-out', () => {
    recordActivity(1234);

    clearLastActivity();

    expect(readLastActivity()).toBeNull();
  });

  it('should broadcast a sign-out reason that other tabs can read', () => {
    vi.useFakeTimers();
    vi.setSystemTime(5000);

    broadcastSignOut('idle');

    const [[key, value]] = [...values.entries()];
    expect(JSON.parse(value)).toEqual({ reason: 'idle', at: 5000 });
    expect(readSignOutBroadcast(key, value)).toBe('idle');
  });

  it('should write a new value for every broadcast so each one is delivered', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1);
    broadcastSignOut('manual');
    const first = [...values.values()][0];

    vi.setSystemTime(2);
    broadcastSignOut('manual');

    expect([...values.values()][0]).not.toBe(first);
  });

  it('should ignore unrelated keys, cleared values and unknown reasons', () => {
    broadcastSignOut('manual');
    const [[key, value]] = [...values.entries()];

    expect(readSignOutBroadcast(LAST_ACTIVITY_KEY, value)).toBeNull();
    expect(readSignOutBroadcast(key, null)).toBeNull();
    expect(readSignOutBroadcast(key, '{bad json')).toBeNull();
    expect(readSignOutBroadcast(key, JSON.stringify({ reason: 'other' }))).toBeNull();
  });

  it('should not throw when storage is unavailable', () => {
    vi.stubGlobal('window', {
      get localStorage() {
        throw new Error('Storage blocked');
      },
    });

    expect(readLastActivity()).toBeNull();
    expect(getStartingActivity(5000)).toBe(5000);
    expect(() => recordActivity(1)).not.toThrow();
    expect(() => clearLastActivity()).not.toThrow();
    expect(() => broadcastSignOut('idle')).not.toThrow();
  });
});

describe('activity time when storage reads work but writes fail', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: (key: string) => values.delete(key),
      },
    });
    clearLastActivity();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('should keep a fresh sign-in time in memory when it cannot be stored', () => {
    expect(() => recordActivity(5000)).not.toThrow();

    expect(values.has(LAST_ACTIVITY_KEY)).toBe(false);
    expect(readLastActivity()).toBe(5000);
  });

  it('should start the idle clock from the in-memory time instead of signing out', () => {
    recordActivity(5000);

    expect(getStartingActivity(999_999)).toBe(5000);
  });

  it('should prefer the newer of the stored and in-memory times', () => {
    recordActivity(5000);

    values.set(LAST_ACTIVITY_KEY, '4000');
    expect(getStartingActivity(999_999)).toBe(5000);

    values.set(LAST_ACTIVITY_KEY, '6000');
    expect(getStartingActivity(999_999)).toBe(6000);
  });

  it('should forget the in-memory time on sign-out', () => {
    recordActivity(5000);

    clearLastActivity();

    expect(readLastActivity()).toBeNull();
    expect(getStartingActivity(999_999)).toBe(999_999);
  });
});

describe('sign-out destination and message', () => {
  it('should only add the idle reason for automatic sign-out', () => {
    expect(getSignedOutPath('idle')).toBe('/login?reason=idle');
    expect(getSignedOutPath('manual')).toBe('/login');
  });

  it('should state the configured inactivity period', () => {
    expect(getIdleSignOutMessage(10)).toBe(
      'You were automatically signed out due to 10 minutes of inactivity. Please sign in again to continue.'
    );
    expect(getIdleSignOutMessage(1)).toContain('1 minute of inactivity');
  });
});
