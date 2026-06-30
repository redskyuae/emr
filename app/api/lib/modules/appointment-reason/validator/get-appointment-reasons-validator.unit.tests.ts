import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateGetAppointmentReasons } from './get-appointment-reasons-validator';

describe('GetAppointmentReasons validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate tenantId input', () => {
    expect(validateGetAppointmentReasons('tenant-1')).toEqual({
      success: true,
      data: 'tenant-1',
    });
  });

  it('should return validation error when tenantId is empty', () => {
    expect(validateGetAppointmentReasons('  ')).toMatchObject({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
