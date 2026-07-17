import { beforeEach, describe, expect, it, vi } from 'vitest';

import { wardRepository } from '../repository/ward-repository';
import { validateGetWardById } from '../validator/get-ward-by-id-validator';
import { getWardByIdQuery } from './get-ward-by-id-query';
import { getWardsQuery } from './get-wards-query';

vi.mock('../repository/ward-repository', () => ({
  wardRepository: { getWardById: vi.fn(), getWards: vi.fn() },
}));
vi.mock('../validator/get-ward-by-id-validator', () => ({
  validateGetWardById: vi.fn(),
}));

const repo = vi.mocked(wardRepository);
const validateById = vi.mocked(validateGetWardById);

const ward = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'General Ward',
  code: 'GEN',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Ward queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.getWardById.mockResolvedValue(ward);
    repo.getWards.mockResolvedValue({ data: [ward], total: 1 });
  });

  describe('getWardByIdQuery', () => {
    it('should short-circuit and not call the repository when validation fails', async () => {
      validateById.mockReturnValue({ success: false, errors: ['Ward abc is Invalid.'] });

      await expect(getWardByIdQuery('abc', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Ward abc is Invalid.'],
      });
      expect(repo.getWardById).not.toHaveBeenCalled();
    });

    it('should return not found when the row is missing', async () => {
      repo.getWardById.mockResolvedValue(undefined);

      await expect(getWardByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
    });

    it('should return the ward on success', async () => {
      await expect(getWardByIdQuery('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: ward,
      });
      expect(repo.getWardById).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });

  describe('getWardsQuery', () => {
    it('should short-circuit and not call the repository when the tenant id is blank', async () => {
      const result = await getWardsQuery({ tenantId: '  ' });

      expect(result.success).toBe(false);
      expect(repo.getWards).not.toHaveBeenCalled();
    });

    it('should pass paging and search params through to the repository', async () => {
      await getWardsQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'gen' });

      expect(repo.getWards).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        page: 2,
        limit: 5,
        query: 'gen',
      });
    });

    it('should return the list query result shape', async () => {
      await expect(getWardsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
        success: true,
        data: [ward],
        total: 1,
      });
    });
  });
});
