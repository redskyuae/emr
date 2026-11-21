import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admitSourceRepository } from '../repository/admit-source-repository';
import { validateCreateAdmitSource } from './create-admit-source-validator';
import { validateDeleteAdmitSource } from './delete-admit-source-validator';
import { validateGetAdmitSourceById } from './get-admit-source-by-id-validator';
import { validateGetAdmitSources } from './get-admit-sources-validator';
import { validateUpdateAdmitSource } from './update-admit-source-validator';
import { getAdmitSourceUniqueConstraintErrors } from './admit-source-uniqueness-validator';

vi.mock('../repository/admit-source-repository', () => ({
  admitSourceRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAdmitSourceById: vi.fn(),
  },
}));

const repo = vi.mocked(admitSourceRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Doctor Referral',
  code: 'DOCREF',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AdmitSource validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAdmitSourceById.mockResolvedValue(existing);
  });

  describe('validateCreateAdmitSource', () => {
    it('should not call uniqueness checks when schema parsing fails', async () => {
      const result = await validateCreateAdmitSource({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(repo.findActiveByName).not.toHaveBeenCalled();
      expect(repo.findActiveByCode).not.toHaveBeenCalled();
    });

    it('should return the parsed data when the admit source is unique', async () => {
      const result = await validateCreateAdmitSource(
        { name: ' Doctor Referral ', code: 'docref' },
        'tenant-1'
      );

      expect(result).toEqual({
        success: true,
        data: { name: 'Doctor Referral', code: 'DOCREF', description: undefined },
      });
    });

    it('should return conflict when the name already exists for the tenant', async () => {
      repo.findActiveByName.mockResolvedValue(existing);

      const result = await validateCreateAdmitSource(
        { name: 'Doctor Referral', code: 'DOCREF' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Admit source name 'Doctor Referral' already exists."],
      });
    });

    it('should return conflict when the code already exists for the tenant', async () => {
      repo.findActiveByCode.mockResolvedValue(existing);

      const result = await validateCreateAdmitSource(
        { name: 'Clinic Referral', code: 'docref' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Admit source code 'DOCREF' already exists."],
      });
    });
  });

  describe('validateUpdateAdmitSource', () => {
    it('should return an invalid id error for a non-numeric id', async () => {
      const result = await validateUpdateAdmitSource(
        'abc',
        { name: 'Doctor Referral', code: 'DOCREF' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        errors: ['Admit source abc is Invalid.'],
      });
      expect(repo.getAdmitSourceById).not.toHaveBeenCalled();
    });

    it('should return not found when the admit source does not exist', async () => {
      repo.getAdmitSourceById.mockResolvedValue(undefined);

      const result = await validateUpdateAdmitSource(
        '1',
        { name: 'Doctor Referral', code: 'DOCREF' },
        'tenant-1'
      );

      expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
    });

    it('should pass excludeId to the uniqueness check', async () => {
      await validateUpdateAdmitSource(
        '7',
        { name: 'Clinic Referral', code: 'clinref' },
        'tenant-1'
      );

      expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Clinic Referral', {
        excludeId: 7,
      });
      expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'CLINREF', { excludeId: 7 });
    });

    it('should return the id and parsed payload on success', async () => {
      const result = await validateUpdateAdmitSource(
        '7',
        { name: 'Clinic Referral', code: 'clinref' },
        'tenant-1'
      );

      expect(result).toEqual({
        success: true,
        data: {
          id: 7,
          payload: { name: 'Clinic Referral', code: 'CLINREF', description: undefined },
        },
      });
    });
  });

  describe('validateDeleteAdmitSource', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateDeleteAdmitSource('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Admit source abc is Invalid.'],
      });
    });

    it('should return an error when the tenant id is blank', () => {
      expect(validateDeleteAdmitSource('1', '  ')).toMatchObject({ success: false });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateDeleteAdmitSource('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetAdmitSourceById', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateGetAdmitSourceById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Admit source abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateGetAdmitSourceById('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetAdmitSources', () => {
    it('should reject a blank tenant id', () => {
      expect(validateGetAdmitSources('  ')).toMatchObject({ success: false });
    });

    it('should return the trimmed tenant id on success', () => {
      expect(validateGetAdmitSources(' tenant-1 ')).toEqual({ success: true, data: 'tenant-1' });
    });
  });

  describe('getAdmitSourceUniqueConstraintErrors', () => {
    it('should map the name constraint to the duplicate name error', () => {
      expect(
        getAdmitSourceUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'admit_source_tenant_name_idx' } },
          { name: 'Doctor Referral', code: 'DOCREF' }
        )
      ).toEqual(["Admit source name 'Doctor Referral' already exists."]);
    });

    it('should map the code constraint to the duplicate code error', () => {
      expect(
        getAdmitSourceUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'admit_source_tenant_code_idx' } },
          { name: 'Doctor Referral', code: 'DOCREF' }
        )
      ).toEqual(["Admit source code 'DOCREF' already exists."]);
    });

    it('should return no errors for an unrelated database error', () => {
      expect(
        getAdmitSourceUniqueConstraintErrors(
          { cause: { code: '23503' } },
          { name: 'Doctor Referral', code: 'DOCREF' }
        )
      ).toEqual([]);
    });
  });
});
