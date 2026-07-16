import { StatusCodes } from 'http-status-codes';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientRepository } from '../../patient/repository/patient-repository';
import { validateGetPatientChart } from './get-patient-chart-validator';

vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));

const patientRepo = patientRepository as typeof patientRepository & {
  getPatientById: Mock<typeof patientRepository.getPatientById>;
};

describe('PatientChart validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patientRepo.getPatientById.mockResolvedValue({ id: 1 } as never);
  });

  it('should reject an invalid patient id without hitting the repository', async () => {
    const result = await validateGetPatientChart('abc', 'tenant-1');
    expect(result).toMatchObject({ success: false });
    expect(patientRepo.getPatientById).not.toHaveBeenCalled();
  });

  it('should return not-found when the patient does not exist', async () => {
    patientRepo.getPatientById.mockResolvedValue(undefined);
    const result = await validateGetPatientChart('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should pass for an existing patient', async () => {
    const result = await validateGetPatientChart('1', 'tenant-1');
    expect(result).toMatchObject({ success: true, data: { patientId: 1, tenantId: 'tenant-1' } });
  });
});
