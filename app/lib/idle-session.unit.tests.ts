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
  readLastActivity,
  readSignOutBroadcast,
  recordActivity,
} from './idle-session';

const TEN_MINUTES = 10 * 60_000;

describe('idle timeout configuration', () => {
  it('should default to 10 minutes when the value is missing or invalid', () => {
    expect(parseIdleTimeoutMinutes(undefined)).toBe(10);
    expect(parseIdleTimeoutMinutes('')).toBe(10);
    expect(parseIdleTimeoutMinutes('abc')).toBe(10);
    expect(parseIdleTimeoutMinutes('-5')).toBe(10);
  });

  it('should reject a timeout that is not longer than the warning period', () => {
    expect(parseIdleTimeoutMinutes('1')).toBe(10);
    expect(parseIdleTimeoutMinutes('0.5')).toBe(10);
  });

  it('should accept a configured timeout', () => {
    expect(parseIdleTimeoutMinutes('15')).toBe(15);
    expect(parseIdleTimeoutMinutes('2')).toBe(2);
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

  it('should give no starting time when nothing proves recent activity', () => {
    expect(getStartingActivity(999_999)).toBeNull();

    values.set(LAST_ACTIVITY_KEY, 'not-a-time');
    expect(getStartingActivity(999_999)).toBeNull();
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
