import { describe, expect, it } from 'vitest';

import { canCancelAppointment } from './appointment-cancellation';

describe('Appointment cancellation', () => {
  it.each([
    ['scheduled', true],
    ['confirmed', true],
    ['checked_in', false],
    ['completed', false],
    ['cancelled', false],
    ['no_show', false],
  ] as const)('should return %s eligibility as %s', (category, expected) => {
    expect(canCancelAppointment(category)).toBe(expected);
  });
});
