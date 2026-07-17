import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admissionRepository } from '../repository/admission-repository';
import type { Admission, AdmissionBedTransferEntry } from '../schemas/admission-schema';
import { getAdmissionByIdQuery } from './get-admission-by-id-query';
import { getAdmissionsQuery } from './get-admissions-query';

vi.mock('../repository/admission-repository', () => ({
  admissionRepository: {
    getAdmissions: vi.fn(),
    getAdmissionById: vi.fn(),
    getBedTransfersByAdmissionId: vi.fn(),
  },
}));

const repo = vi.mocked(admissionRepository);

const admission = { id: 1, admissionNumber: 'ADM-1001', status: 'ADMITTED' } as Admission;
const transfers: AdmissionBedTransferEntry[] = [
  {
    id: 5,
    reason: null,
    transferredAt: new Date(),
    fromBed: { id: 9, bedNumber: 'ICU-01' },
    toBed: { id: 10, bedNumber: 'ICU-02' },
  },
];

describe('Admission queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getAdmissionById.mockResolvedValue(admission);
    repo.getBedTransfersByAdmissionId.mockResolvedValue(transfers);
    repo.getAdmissions.mockResolvedValue({ data: [admission], total: 1 });
  });

  describe('getAdmissionByIdQuery', () => {
    it('should short-circuit and not call the repository for an invalid id', async () => {
      await expect(getAdmissionByIdQuery('abc', 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Admission abc is Invalid.'],
      });
      expect(repo.getAdmissionById).not.toHaveBeenCalled();
    });

    it('should return not found when the row is missing', async () => {
      repo.getAdmissionById.mockResolvedValue(undefined);

      await expect(getAdmissionByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
      expect(repo.getBedTransfersByAdmissionId).not.toHaveBeenCalled();
    });

    it('should return the admission with its transfer history embedded', async () => {
      await expect(getAdmissionByIdQuery('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: { ...admission, transfers },
      });
      expect(repo.getBedTransfersByAdmissionId).toHaveBeenCalledWith('tenant-1', 1);
    });
  });

  describe('getAdmissionsQuery', () => {
    it('should reject a blank tenant id without calling the repository', async () => {
      await expect(getAdmissionsQuery({ tenantId: '  ' })).resolves.toMatchObject({
        success: false,
      });
      expect(repo.getAdmissions).not.toHaveBeenCalled();
    });

    it('should reject an unknown status', async () => {
      await expect(
        getAdmissionsQuery({ tenantId: 'tenant-1', status: 'OPEN' })
      ).resolves.toMatchObject({ success: false, errors: ['Status is Invalid.'] });
    });

    it('should default the census to active admissions when unfiltered', async () => {
      await getAdmissionsQuery({ tenantId: 'tenant-1' });

      expect(repo.getAdmissions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ADMITTED' })
      );
    });

    it('should not force the status filter for a patient history read', async () => {
      await getAdmissionsQuery({ tenantId: 'tenant-1', patientId: 7 });

      expect(repo.getAdmissions).toHaveBeenCalledWith(expect.objectContaining({ patientId: 7 }));
      expect(repo.getAdmissions.mock.calls[0]?.[0]?.status).toBeUndefined();
    });

    it('should respect an explicit status filter', async () => {
      await getAdmissionsQuery({ tenantId: 'tenant-1', status: 'DISCHARGED' });

      expect(repo.getAdmissions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DISCHARGED' })
      );
    });

    it('should return the rows and total on success', async () => {
      await expect(getAdmissionsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
        success: true,
        data: [admission],
        total: 1,
      });
    });
  });
});
