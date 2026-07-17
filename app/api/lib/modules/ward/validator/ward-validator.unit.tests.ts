import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bedRepository } from '../../bed/repository/bed-repository';
import { wardRepository } from '../repository/ward-repository';
import { validateCreateWard } from './create-ward-validator';
import { validateDeleteWard } from './delete-ward-validator';
import { validateGetWardById } from './get-ward-by-id-validator';
import { validateGetWards } from './get-wards-validator';
import { validateUpdateWard } from './update-ward-validator';
import { getWardUniqueConstraintErrors } from './ward-uniqueness-validator';

vi.mock('../repository/ward-repository', () => ({
  wardRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getWardById: vi.fn(),
  },
}));

vi.mock('../../bed/repository/bed-repository', () => ({
  bedRepository: {
    countActiveBedsByWardId: vi.fn(),
  },
}));

const repo = vi.mocked(wardRepository);
const bedRepo = vi.mocked(bedRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'General Ward',
  code: 'GEN',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Ward validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getWardById.mockResolvedValue(existing);
    bedRepo.countActiveBedsByWardId.mockResolvedValue(0);
  });

  describe('validateCreateWard', () => {
    it('should not call uniqueness checks when schema parsing fails', async () => {
      const result = await validateCreateWard({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(repo.findActiveByName).not.toHaveBeenCalled();
      expect(repo.findActiveByCode).not.toHaveBeenCalled();
    });

    it('should return the parsed data when the ward is unique', async () => {
      const result = await validateCreateWard({ name: ' General Ward ', code: 'gen' }, 'tenant-1');

      expect(result).toEqual({
        success: true,
        data: { name: 'General Ward', code: 'GEN', description: undefined },
      });
    });

    it('should return conflict when the name already exists for the tenant', async () => {
      repo.findActiveByName.mockResolvedValue(existing);

      const result = await validateCreateWard({ name: 'General Ward', code: 'GEN' }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Ward name 'General Ward' already exists."],
      });
    });

    it('should return conflict when the code already exists for the tenant', async () => {
      repo.findActiveByCode.mockResolvedValue(existing);

      const result = await validateCreateWard({ name: 'Maternity', code: 'gen' }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Ward code 'GEN' already exists."],
      });
    });
  });

  describe('validateUpdateWard', () => {
    it('should return an invalid id error for a non-numeric id', async () => {
      const result = await validateUpdateWard(
        'abc',
        { name: 'General Ward', code: 'GEN' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        errors: ['Ward abc is Invalid.'],
      });
      expect(repo.getWardById).not.toHaveBeenCalled();
    });

    it('should return not found when the ward does not exist', async () => {
      repo.getWardById.mockResolvedValue(undefined);

      const result = await validateUpdateWard(
        '1',
        { name: 'General Ward', code: 'GEN' },
        'tenant-1'
      );

      expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
    });

    it('should pass excludeId to the uniqueness check', async () => {
      await validateUpdateWard('7', { name: 'Maternity', code: 'mat' }, 'tenant-1');

      expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Maternity', { excludeId: 7 });
      expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'MAT', { excludeId: 7 });
    });

    it('should return the id and parsed payload on success', async () => {
      const result = await validateUpdateWard('7', { name: 'Maternity', code: 'mat' }, 'tenant-1');

      expect(result).toEqual({
        success: true,
        data: { id: 7, payload: { name: 'Maternity', code: 'MAT', description: undefined } },
      });
    });
  });

  describe('validateDeleteWard', () => {
    it('should return an invalid id error for a non-numeric id without touching the repositories', async () => {
      await expect(validateDeleteWard('abc', 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Ward abc is Invalid.'],
      });
      expect(repo.getWardById).not.toHaveBeenCalled();
      expect(bedRepo.countActiveBedsByWardId).not.toHaveBeenCalled();
    });

    it('should return an error when the tenant id is blank', async () => {
      await expect(validateDeleteWard('1', '  ')).resolves.toMatchObject({ success: false });
    });

    it('should return not found when the ward does not exist', async () => {
      repo.getWardById.mockResolvedValue(undefined);

      await expect(validateDeleteWard('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.NOT_FOUND,
        errors: ['Ward not found'],
      });
      expect(bedRepo.countActiveBedsByWardId).not.toHaveBeenCalled();
    });

    it('should return conflict when beds are still assigned to the ward', async () => {
      bedRepo.countActiveBedsByWardId.mockResolvedValue(3);

      await expect(validateDeleteWard('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Ward General Ward cannot be removed while Beds are assigned to it.'],
      });
    });

    it('should return the id and tenant id when the ward has no beds', async () => {
      await expect(validateDeleteWard('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
      expect(bedRepo.countActiveBedsByWardId).toHaveBeenCalledWith('tenant-1', 1);
    });
  });

  describe('validateGetWardById', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateGetWardById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Ward abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateGetWardById('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetWards', () => {
    it('should reject a blank tenant id', () => {
      expect(validateGetWards('  ')).toMatchObject({ success: false });
    });

    it('should return the trimmed tenant id on success', () => {
      expect(validateGetWards(' tenant-1 ')).toEqual({ success: true, data: 'tenant-1' });
    });
  });

  describe('getWardUniqueConstraintErrors', () => {
    it('should map the name constraint to the duplicate name error', () => {
      expect(
        getWardUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'ward_tenant_name_idx' } },
          { name: 'General Ward', code: 'GEN' }
        )
      ).toEqual(["Ward name 'General Ward' already exists."]);
    });

    it('should map the code constraint to the duplicate code error', () => {
      expect(
        getWardUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'ward_tenant_code_idx' } },
          { name: 'General Ward', code: 'GEN' }
        )
      ).toEqual(["Ward code 'GEN' already exists."]);
    });

    it('should return no errors for an unrelated database error', () => {
      expect(
        getWardUniqueConstraintErrors(
          { cause: { code: '23503' } },
          { name: 'General Ward', code: 'GEN' }
        )
      ).toEqual([]);
    });
  });
});
