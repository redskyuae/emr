import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admissionTypeRepository } from '../repository/admission-type-repository';
import { validateGetAdmissionTypeById } from '../validator/get-admission-type-by-id-validator';
import { getAdmissionTypeByIdQuery } from './get-admission-type-by-id-query';
import { getAdmissionTypesQuery } from './get-admission-types-query';

vi.mock('../repository/admission-type-repository', () => ({
  admissionTypeRepository: { getAdmissionTypeById: vi.fn(), getAdmissionTypes: vi.fn() },
}));
vi.mock('../validator/get-admission-type-by-id-validator', () => ({
  validateGetAdmissionTypeById: vi.fn(),
}));

const repo = vi.mocked(admissionTypeRepository);
const validateById = vi.mocked(validateGetAdmissionTypeById);

const admissionType = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Emergency',
  code: 'EMER',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AdmissionType queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.getAdmissionTypeById.mockResolvedValue(admissionType);
    repo.getAdmissionTypes.mockResolvedValue({ data: [admissionType], total: 1 });
  });

  describe('getAdmissionTypeByIdQuery', () => {
    it('should short-circuit and not call the repository when validation fails', async () => {
      validateById.mockReturnValue({ success: false, errors: ['Admission type abc is Invalid.'] });

      await expect(getAdmissionTypeByIdQuery('abc', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Admission type abc is Invalid.'],
      });
      expect(repo.getAdmissionTypeById).not.toHaveBeenCalled();
    });

    it('should return not found when the row is missing', async () => {
      repo.getAdmissionTypeById.mockResolvedValue(undefined);

      await expect(getAdmissionTypeByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
    });

    it('should return the admission type on success', async () => {
      await expect(getAdmissionTypeByIdQuery('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: admissionType,
      });
      expect(repo.getAdmissionTypeById).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });

  describe('getAdmissionTypesQuery', () => {
    it('should short-circuit and not call the repository when the tenant id is blank', async () => {
      const result = await getAdmissionTypesQuery({ tenantId: '  ' });

      expect(result.success).toBe(false);
      expect(repo.getAdmissionTypes).not.toHaveBeenCalled();
    });

    it('should pass paging and search params through to the repository', async () => {
      await getAdmissionTypesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'emer' });

      expect(repo.getAdmissionTypes).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        page: 2,
        limit: 5,
        query: 'emer',
      });
    });

    it('should return the list query result shape', async () => {
      await expect(getAdmissionTypesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
        success: true,
        data: [admissionType],
        total: 1,
      });
    });
  });
});
