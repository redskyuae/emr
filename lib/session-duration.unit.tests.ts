import { describe, expect, it } from 'vitest';

import { formatDuration, sessionDuration } from './session-duration';

const MINUTE = 60_000;

describe('Session duration', () => {
  it('should format durations in days, hours and minutes', () => {
    expect(formatDuration(30_000)).toBe('< 1 min');
    expect(formatDuration(45 * MINUTE)).toBe('45 min');
    expect(formatDuration(134 * MINUTE)).toBe('2 h 14 min');
    expect(formatDuration(120 * MINUTE)).toBe('2 h');
    expect(formatDuration((3 * 1440 + 4 * 60) * MINUTE)).toBe('3 d 4 h');
    expect(formatDuration(-1)).toBeNull();
  });

  it('should measure an active Session to now and an ended one to its end', () => {
    const now = new Date('2026-11-22T12:00:00Z');

    expect(
      sessionDuration(
        { signedInAt: new Date('2026-11-22T10:00:00Z'), endedAt: null, status: 'active' },
        now
      )
    ).toBe('2 h');
    expect(
      sessionDuration(
        {
          signedInAt: new Date('2026-11-22T10:00:00Z'),
          endedAt: new Date('2026-11-22T10:30:00Z'),
          status: 'signed-out',
        },
        now
      )
    ).toBe('30 min');
    expect(
      sessionDuration(
        { signedInAt: new Date('2026-11-22T10:00:00Z'), endedAt: null, status: 'expired' },
        now
      )
    ).toBeNull();
  });
});
