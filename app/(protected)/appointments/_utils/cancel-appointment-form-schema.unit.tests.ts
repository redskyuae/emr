import { describe, expect, it } from 'vitest';

import { cancelAppointmentFormSchema } from './cancel-appointment-form-schema';

describe('cancelAppointmentFormSchema', () => {
  it('should require a positive Appointment Cancelled Reason ID', () => {
    expect(
      cancelAppointmentFormSchema.safeParse({ appointmentCancelledReasonId: '' }).success
    ).toBe(false);
    expect(
      cancelAppointmentFormSchema.safeParse({ appointmentCancelledReasonId: '0' }).success
    ).toBe(false);
  });

  it('should accept a selected Appointment Cancelled Reason ID', () => {
    expect(cancelAppointmentFormSchema.parse({ appointmentCancelledReasonId: '17' })).toEqual({
      appointmentCancelledReasonId: 17,
    });
  });
});
