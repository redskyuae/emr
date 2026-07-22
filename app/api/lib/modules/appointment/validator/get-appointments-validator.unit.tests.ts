import { describe, expect, it } from 'vitest';

import { validateGetAppointments } from './get-appointments-validator';

describe('validateGetAppointments', () => {
  it('should reject a blank tenant id', () => {
    expect(validateGetAppointments({}, '  ')).toMatchObject({ success: false });
  });

  it('should default missing filters to an empty filter set', () => {
    expect(validateGetAppointments(undefined, 'tenant-1')).toEqual({
      success: true,
      data: { tenantId: 'tenant-1' },
    });
  });

  it('should transform the slot date filter to ISO', () => {
    expect(validateGetAppointments({ slotDate: '16-07-2026' }, 'tenant-1')).toMatchObject({
      success: true,
      data: { slotDate: '2026-07-16', tenantId: 'tenant-1' },
    });
  });

  it('should reject invalid filter values', () => {
    expect(validateGetAppointments({ appointmentStatusId: '0' }, 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Appointment status ID must be positive'],
    });
  });
});
