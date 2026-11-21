import { describe, expect, it } from 'vitest';

import { checkInBlockKind, checkInMode, checkInSection } from './check-in-analytics';

describe('checkInMode', () => {
  it('should name the walk-in mode in snake case', () => {
    expect(checkInMode('walk-in')).toBe('walk_in');
    expect(checkInMode('appointment')).toBe('appointment');
  });
});

describe('checkInSection', () => {
  it('should be the Patient section until the Patient is confirmed', () => {
    expect(checkInSection({ confirmed: false, createInvoice: true })).toBe('patient');
  });

  it('should tell Visit details apart from Billing once confirmed', () => {
    expect(checkInSection({ confirmed: true, createInvoice: false })).toBe('visit_details');
    expect(checkInSection({ confirmed: true, createInvoice: true })).toBe('billing');
  });
});

describe('checkInBlockKind', () => {
  it('should classify the Patient blocks the server reports', () => {
    expect(
      checkInBlockKind([
        'Patient 42 is provisional and must complete registration before check-in.',
      ])
    ).toBe('provisional_patient');
    expect(checkInBlockKind(['Patient 42 is inactive and cannot be checked in.'])).toBe(
      'inactive_patient'
    );
    expect(checkInBlockKind(['Patient 42 already has an active visit.'])).toBe(
      'active_visit_exists'
    );
  });

  it('should classify the Appointment blocks the server reports', () => {
    expect(checkInBlockKind(['Appointment BK-0042 already has a visit.'])).toBe(
      'appointment_already_checked_in'
    );
    expect(checkInBlockKind(['Appointment already has a visit.'])).toBe(
      'appointment_already_checked_in'
    );
    expect(checkInBlockKind(['Appointment BK-0042 is not scheduled for today.'])).toBe(
      'appointment_not_today'
    );
    expect(checkInBlockKind(['Appointment BK-0042 is not in a checked-in eligible status.'])).toBe(
      'appointment_not_eligible'
    );
    expect(checkInBlockKind(['Appointment is no longer eligible for Check-in.'])).toBe(
      'appointment_not_eligible'
    );
  });

  it('should return null for a failure that is not a block', () => {
    expect(checkInBlockKind(['Visit Number allocation conflicted. Please retry.'])).toBeNull();
    expect(checkInBlockKind([])).toBeNull();
  });
});
