import { describe, expect, it } from 'vitest';

import { waitingLabel } from './visit-status';

describe('waitingLabel', () => {
  const checkedInAt = '2026-11-05T09:00:00.000Z';
  const at = (minutes: number) => new Date(checkedInAt).getTime() + minutes * 60_000;

  it('should treat a Patient checked in under a minute ago as just arrived', () => {
    expect(waitingLabel(checkedInAt, at(0))).toBe('Just arrived');
  });

  it('should show minutes under an hour', () => {
    expect(waitingLabel(checkedInAt, at(42))).toBe('Waiting 42 min');
  });

  it('should show hours and minutes from an hour on', () => {
    expect(waitingLabel(checkedInAt, at(75))).toBe('Waiting 1 h 15 min');
  });

  it('should not show a negative wait when clocks disagree', () => {
    expect(waitingLabel(checkedInAt, at(-3))).toBe('Just arrived');
  });
});
