import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { validateGetVisitPatientType } from './get-visit-patient-type-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));

describe('validateGetVisitPatientType', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects invalid Patient IDs without a lookup', async () => {
    expect(await validateGetVisitPatientType('abc', 'tenant-1')).toEqual({
      success: false,
      errors: ['Patient ID must be a positive integer.'],
    });
    expect(patientRepository.getPatientById).not.toHaveBeenCalled();
  });

  it('requires a Patient in the current Tenant', async () => {
    vi.mocked(patientRepository.getPatientById).mockResolvedValue(undefined);
    expect(await validateGetVisitPatientType('7', 'tenant-1')).toEqual({
      success: false,
      errors: ['Patient not found.'],
    });
    expect(patientRepository.getPatientById).toHaveBeenCalledWith(7, 'tenant-1');
  });
});
