import { describe, expect, it } from 'vitest';

import { validateGetAppointmentById } from './get-appointment-by-id-validator';

describe('GetAppointmentById validator', () => {
  it('should coerce a numeric string id', () => {
    expect(validateGetAppointmentById('1042', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1042, tenantId: 'tenant-1' },
    });
  });

  it('should reject a non-numeric id with the entity wording', () => {
    expect(validateGetAppointmentById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Appointment abc is Invalid.'],
    });
  });

  it('should reject a non-positive id', () => {
    expect(validateGetAppointmentById('0', 'tenant-1')).toMatchObject({ success: false });
  });

  it('should reject an empty tenant id', () => {
    expect(validateGetAppointmentById('1042', '   ')).toMatchObject({ success: false });
  });
});
