import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateGetAppointmentReasonById } from './get-appointment-reason-by-id-validator';

describe('GetAppointmentReasonById validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate id and tenantId inputs', () => {
    expect(validateGetAppointmentReasonById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
  });

  it('should return validation error when id is invalid', () => {
    expect(validateGetAppointmentReasonById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Appointment reason abc is Invalid.'],
    });
  });

  it('should return validation error when tenantId is empty', () => {
    expect(validateGetAppointmentReasonById('1', '  ')).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Tenant ID cannot be empty']),
    });
  });

  it('should return validation errors when both id and tenantId are invalid', () => {
    expect(validateGetAppointmentReasonById('abc', '  ')).toMatchObject({
      success: false,
      errors: expect.arrayContaining([
        'Appointment reason abc is Invalid.',
        'Tenant ID cannot be empty',
      ]),
    });
  });
});
