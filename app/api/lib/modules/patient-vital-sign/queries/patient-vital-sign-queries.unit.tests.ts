import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientVitalSignRepository } from '../repository/patient-vital-sign-repository';
import { getPatientVitalSignsQuery } from './get-patient-vital-signs-query';
import { getPatientVitalSignByIdQuery } from './get-patient-vital-sign-by-id-query';

vi.mock('../repository/patient-vital-sign-repository', () => ({
  patientVitalSignRepository: {
    getPatientVitalSigns: vi.fn(),
    getPatientVitalSignById: vi.fn(),
  },
}));

const repo = patientVitalSignRepository as typeof patientVitalSignRepository & {
  getPatientVitalSigns: Mock<typeof patientVitalSignRepository.getPatientVitalSigns>;
  getPatientVitalSignById: Mock<typeof patientVitalSignRepository.getPatientVitalSignById>;
};
const vitalSign = { id: 4, patientId: 1 } as never;

describe('PatientVitalSign queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getPatientVitalSigns.mockResolvedValue({ data: [vitalSign], total: 1 });
    repo.getPatientVitalSignById.mockResolvedValue(vitalSign);
  });

  it('should not call repository when list validation fails', async () => {
    await expect(
      getPatientVitalSignsQuery({ patientId: 'abc', tenantId: 'tenant-1' })
    ).resolves.toMatchObject({ success: false });
    expect(repo.getPatientVitalSigns).not.toHaveBeenCalled();
  });

  it('should return the vital sign list', async () => {
    await expect(
      getPatientVitalSignsQuery({ patientId: '1', tenantId: 'tenant-1' })
    ).resolves.toEqual({ success: true, data: [vitalSign], total: 1 });
  });

  it('should return a single vital sign', async () => {
    await expect(getPatientVitalSignByIdQuery('4', 'tenant-1')).resolves.toEqual({
      success: true,
      data: vitalSign,
    });
  });

  it('should return not-found when the vital sign is missing', async () => {
    repo.getPatientVitalSignById.mockResolvedValue(undefined);
    await expect(getPatientVitalSignByIdQuery('4', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: 404,
    });
  });
});
