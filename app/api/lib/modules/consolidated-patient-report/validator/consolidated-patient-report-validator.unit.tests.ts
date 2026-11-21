import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import type { Patient } from '../../patient/schemas/patient-schema';
import { validateGetConsolidatedPatientReport } from './get-consolidated-patient-report-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));

const getPatientById = vi.mocked(patientRepository.getPatientById);
const period = { fromDate: '01-11-2026', toDate: '20-11-2026' };

describe('Consolidated Patient Report validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPatientById.mockResolvedValue({ id: 7 } as Patient);
  });

  it('should return the Patient, Tenant and ISO period when valid', async () => {
    await expect(validateGetConsolidatedPatientReport('7', 'tenant-1', period)).resolves.toEqual({
      success: true,
      data: { patientId: 7, tenantId: 'tenant-1', fromDate: '2026-11-01', toDate: '2026-11-20' },
    });
    expect(getPatientById).toHaveBeenCalledWith(7, 'tenant-1');
  });

  it('should reject an invalid Patient ID without reading the repository', async () => {
    const result = await validateGetConsolidatedPatientReport('abc', 'tenant-1', period);

    expect(result).toEqual({ success: false, errors: ['Patient abc is Invalid.'] });
    expect(getPatientById).not.toHaveBeenCalled();
  });

  it('should reject an empty Tenant without reading the repository', async () => {
    const result = await validateGetConsolidatedPatientReport('7', '  ', period);

    expect(result.success).toBe(false);
    expect(getPatientById).not.toHaveBeenCalled();
  });

  it('should report every period error without reading the repository', async () => {
    const result = await validateGetConsolidatedPatientReport('7', 'tenant-1', {});

    expect(result).toEqual({
      success: false,
      errors: ['To date is required', 'From date is required'],
    });
    expect(getPatientById).not.toHaveBeenCalled();
  });

  it('should collect Patient and period errors together', async () => {
    const result = await validateGetConsolidatedPatientReport('0', 'tenant-1', {
      fromDate: '21-11-2026',
      toDate: '20-11-2026',
    });

    expect(result).toEqual({
      success: false,
      errors: ['Patient 0 is Invalid.', 'From date must be on or before To date'],
    });
  });

  it('should return 404 when the Patient is not in the Tenant', async () => {
    getPatientById.mockResolvedValue(undefined);

    await expect(validateGetConsolidatedPatientReport('7', 'tenant-1', period)).resolves.toEqual({
      success: false,
      errors: ['Patient not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });
});
