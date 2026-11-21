import { describe, expect, it } from 'vitest';

import {
  daysBetween,
  leadTimeDays,
  minutesBetween,
  minutesVsLocalStart,
} from './lifecycle-durations';

describe('minutesBetween', () => {
  it('should count whole elapsed minutes, rounding down', () => {
    expect(minutesBetween(new Date('2026-11-21T08:00:00Z'), new Date('2026-11-21T08:42:59Z'))).toBe(
      42
    );
  });

  it('should never return a negative duration', () => {
    expect(minutesBetween(new Date('2026-11-21T09:00:00Z'), new Date('2026-11-21T08:00:00Z'))).toBe(
      0
    );
  });
});

describe('daysBetween', () => {
  it('should count whole elapsed days, rounding down', () => {
    expect(daysBetween(new Date('2026-11-18T10:00:00Z'), new Date('2026-11-21T09:59:00Z'))).toBe(2);
  });

  it('should never return a negative duration', () => {
    expect(daysBetween(new Date('2026-11-21T10:00:00Z'), new Date('2026-11-18T10:00:00Z'))).toBe(0);
  });
});

describe('leadTimeDays', () => {
  it('should count calendar days on the Tenant clock', () => {
    // 21:30 UTC on the 20th is already the 21st in Dubai.
    const now = new Date('2026-11-20T21:30:00Z');

    expect(leadTimeDays('21-11-2026', 'Asia/Dubai', now)).toBe(0);
    expect(leadTimeDays('24-11-2026', 'Asia/Dubai', now)).toBe(3);
    expect(leadTimeDays('21-11-2026', 'UTC', now)).toBe(1);
  });

  it('should count a slot date already past as zero', () => {
    expect(leadTimeDays('19-11-2026', 'Asia/Dubai', new Date('2026-11-21T08:00:00Z'))).toBe(0);
  });

  it('should count a malformed slot date as zero', () => {
    expect(leadTimeDays('2026-11-24', 'Asia/Dubai')).toBe(0);
  });
});

describe('minutesVsLocalStart', () => {
  it('should be negative when the moment is before the start on the Tenant clock', () => {
    // 05:50 UTC is 09:50 in Dubai.
    expect(minutesVsLocalStart(new Date('2026-11-21T05:50:00Z'), '10:00', 'Asia/Dubai')).toBe(-10);
  });

  it('should be positive when the moment is after the start', () => {
    expect(minutesVsLocalStart(new Date('2026-11-21T06:25:00Z'), '10:00', 'Asia/Dubai')).toBe(25);
  });

  it('should return undefined for a malformed start time', () => {
    expect(minutesVsLocalStart(new Date(), '10am', 'Asia/Dubai')).toBeUndefined();
  });
});
