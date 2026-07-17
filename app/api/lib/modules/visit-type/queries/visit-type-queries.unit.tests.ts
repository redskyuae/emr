import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitTypeRepository } from '../repository/visit-type-repository';
import { validateGetVisitTypeById } from '../validator/get-visit-type-by-id-validator';
import { getVisitTypeByIdQuery } from './get-visit-type-by-id-query';
import { getVisitTypesQuery } from './get-visit-types-query';

vi.mock('../repository/visit-type-repository', () => ({
  visitTypeRepository: { getVisitTypeById: vi.fn(), getVisitTypes: vi.fn() },
}));
vi.mock('../validator/get-visit-type-by-id-validator', () => ({
  validateGetVisitTypeById: vi.fn(),
}));

const repo = vi.mocked(visitTypeRepository);
const validateById = vi.mocked(validateGetVisitTypeById);

const visitType = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'OPD Consultation',
  code: 'OPD',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('VisitType queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.getVisitTypeById.mockResolvedValue(visitType);
    repo.getVisitTypes.mockResolvedValue({ data: [visitType], total: 1 });
  });

  describe('getVisitTypeByIdQuery', () => {
    it('should short-circuit and not call the repository when validation fails', async () => {
      validateById.mockReturnValue({ success: false, errors: ['Visit type abc is Invalid.'] });

      await expect(getVisitTypeByIdQuery('abc', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit type abc is Invalid.'],
      });
      expect(repo.getVisitTypeById).not.toHaveBeenCalled();
    });

    it('should return not found when the row is missing', async () => {
      repo.getVisitTypeById.mockResolvedValue(undefined);

      await expect(getVisitTypeByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
    });

    it('should return the visit type on success', async () => {
      await expect(getVisitTypeByIdQuery('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: visitType,
      });
      expect(repo.getVisitTypeById).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });

  describe('getVisitTypesQuery', () => {
    it('should short-circuit and not call the repository when the tenant id is blank', async () => {
      const result = await getVisitTypesQuery({ tenantId: '  ' });

      expect(result.success).toBe(false);
      expect(repo.getVisitTypes).not.toHaveBeenCalled();
    });

    it('should pass paging and search params through to the repository', async () => {
      await getVisitTypesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'opd' });

      expect(repo.getVisitTypes).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        page: 2,
        limit: 5,
        query: 'opd',
      });
    });

    it('should return the list query result shape', async () => {
      await expect(getVisitTypesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
        success: true,
        data: [visitType],
        total: 1,
      });
    });
  });
});
