import { describe, expect, it } from 'vitest';

import { validateGetProcedureResourceAvailability } from './get-procedure-resource-availability-validator';

describe('validateGetProcedureResourceAvailability', () => {
  it('should normalize a valid Tenant-scoped Procedure window', () => {
    expect(
      validateGetProcedureResourceAvailability(
        { slotDate: '31-12-2099', startTime: '10:00', endTime: '11:00', patientId: '12' },
        ' tenant-1 '
      )
    ).toEqual({
      success: true,
      data: {
        tenantId: 'tenant-1',
        slotDate: '2099-12-31',
        startTime: '10:00',
        endTime: '11:00',
        patientId: 12,
      },
    });
  });

  it('should return both Tenant and window validation errors', () => {
    expect(validateGetProcedureResourceAvailability({}, ' ')).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Tenant ID cannot be empty', 'Slot date is required']),
    });
  });
});
