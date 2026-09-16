import { beforeEach, describe, expect, it, vi } from 'vitest';

import { treatmentRepository } from '../repository/treatment-repository';
import { validateGetTreatmentById } from '../validator/get-treatment-by-id-validator';
import { getTreatmentByIdQuery } from './get-treatment-by-id-query';
import { getTreatmentsQuery } from './get-treatments-query';

vi.mock('../repository/treatment-repository', () => ({
  treatmentRepository: { getTreatmentById: vi.fn(), getTreatments: vi.fn() },
}));
vi.mock('../validator/get-treatment-by-id-validator', () => ({
  validateGetTreatmentById: vi.fn(),
}));

const repo = vi.mocked(treatmentRepository);
const validateById = vi.mocked(validateGetTreatmentById);

const treatment = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Abhyanga wellness programme',
  code: 'TRT-0400',
  description: null,
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
  roomType: null,
  therapistSkill: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
  sessions: [],
};

describe('Treatment queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.getTreatmentById.mockResolvedValue(treatment);
    repo.getTreatments.mockResolvedValue({ data: [treatment], total: 1 });
  });

  describe('getTreatmentByIdQuery', () => {
    it('should short-circuit and not call the repository when validation fails', async () => {
      validateById.mockReturnValue({ success: false, errors: ['Treatment abc is Invalid.'] });

      await expect(getTreatmentByIdQuery('abc', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Treatment abc is Invalid.'],
      });
      expect(repo.getTreatmentById).not.toHaveBeenCalled();
    });

    it('should return not found when the row is missing', async () => {
      repo.getTreatmentById.mockResolvedValue(undefined);

      await expect(getTreatmentByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
    });

    it('should return the treatment on success', async () => {
      await expect(getTreatmentByIdQuery('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: treatment,
      });
      expect(repo.getTreatmentById).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });

  describe('getTreatmentsQuery', () => {
    it('should short-circuit and not call the repository when the tenant id is blank', async () => {
      const result = await getTreatmentsQuery({ tenantId: '  ' });

      expect(result.success).toBe(false);
      expect(repo.getTreatments).not.toHaveBeenCalled();
    });

    it('should pass paging and search params through to the repository', async () => {
      await getTreatmentsQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'abhyanga' });

      expect(repo.getTreatments).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        page: 2,
        limit: 5,
        query: 'abhyanga',
      });
    });

    it('should return the list query result shape', async () => {
      await expect(getTreatmentsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
        success: true,
        data: [treatment],
        total: 1,
      });
    });
  });
});
