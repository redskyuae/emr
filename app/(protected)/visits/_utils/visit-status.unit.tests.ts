import { describe, expect, it } from 'vitest';

import { visitListStatusPresentation, waitingLabel } from './visit-status';

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

describe('visitListStatusPresentation', () => {
  const signedAt = new Date('2026-11-05T10:00:00.000Z');

  it('should show an In Consultation Visit the Doctor has signed as Doctor Signed', () => {
    expect(
      visitListStatusPresentation({ status: 'IN_CONSULTATION', doctorSignedAt: signedAt }).label
    ).toBe('Doctor Signed');
  });

  it('should show an unsigned In Consultation Visit as In Consultation', () => {
    expect(
      visitListStatusPresentation({ status: 'IN_CONSULTATION', doctorSignedAt: null }).label
    ).toBe('In Consultation');
  });

  it('should show the Visit Status once a signed Visit is completed or cancelled', () => {
    expect(
      visitListStatusPresentation({ status: 'COMPLETED', doctorSignedAt: signedAt }).label
    ).toBe('Completed');
    expect(
      visitListStatusPresentation({ status: 'CANCELLED', doctorSignedAt: signedAt }).label
    ).toBe('Cancelled');
  });
});
