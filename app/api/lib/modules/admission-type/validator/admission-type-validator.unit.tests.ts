import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { admissionTypeRepository } from '../repository/admission-type-repository';
import { validateCreateAdmissionType } from './create-admission-type-validator';
import { validateDeleteAdmissionType } from './delete-admission-type-validator';
import { validateGetAdmissionTypeById } from './get-admission-type-by-id-validator';
import { validateGetAdmissionTypes } from './get-admission-types-validator';
import { validateUpdateAdmissionType } from './update-admission-type-validator';
import { getAdmissionTypeUniqueConstraintErrors } from './admission-type-uniqueness-validator';

vi.mock('../repository/admission-type-repository', () => ({
  admissionTypeRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAdmissionTypeById: vi.fn(),
  },
}));

const repo = vi.mocked(admissionTypeRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Emergency',
  code: 'EMER',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AdmissionType validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAdmissionTypeById.mockResolvedValue(existing);
  });

  describe('validateCreateAdmissionType', () => {
    it('should not call uniqueness checks when schema parsing fails', async () => {
      const result = await validateCreateAdmissionType({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(repo.findActiveByName).not.toHaveBeenCalled();
      expect(repo.findActiveByCode).not.toHaveBeenCalled();
    });

    it('should return the parsed data when the admission type is unique', async () => {
      const result = await validateCreateAdmissionType(
        { name: ' Emergency ', code: 'emer' },
        'tenant-1'
      );

      expect(result).toEqual({
        success: true,
        data: { name: 'Emergency', code: 'EMER', description: undefined },
      });
    });

    it('should return conflict when the name already exists for the tenant', async () => {
      repo.findActiveByName.mockResolvedValue(existing);

      const result = await validateCreateAdmissionType(
        { name: 'Emergency', code: 'EMER' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Admission type name 'Emergency' already exists."],
      });
    });

    it('should return conflict when the code already exists for the tenant', async () => {
      repo.findActiveByCode.mockResolvedValue(existing);

      const result = await validateCreateAdmissionType(
        { name: 'Elective', code: 'emer' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Admission type code 'EMER' already exists."],
      });
    });
  });

  describe('validateUpdateAdmissionType', () => {
    it('should return an invalid id error for a non-numeric id', async () => {
      const result = await validateUpdateAdmissionType(
        'abc',
        { name: 'Emergency', code: 'EMER' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        errors: ['Admission type abc is Invalid.'],
      });
      expect(repo.getAdmissionTypeById).not.toHaveBeenCalled();
    });

    it('should return not found when the admission type does not exist', async () => {
      repo.getAdmissionTypeById.mockResolvedValue(undefined);

      const result = await validateUpdateAdmissionType(
        '1',
        { name: 'Emergency', code: 'EMER' },
        'tenant-1'
      );

      expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
    });

    it('should pass excludeId to the uniqueness check', async () => {
      await validateUpdateAdmissionType('7', { name: 'Elective', code: 'elec' }, 'tenant-1');

      expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Elective', { excludeId: 7 });
      expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'ELEC', { excludeId: 7 });
    });

    it('should return the id and parsed payload on success', async () => {
      const result = await validateUpdateAdmissionType(
        '7',
        { name: 'Elective', code: 'elec' },
        'tenant-1'
      );

      expect(result).toEqual({
        success: true,
        data: { id: 7, payload: { name: 'Elective', code: 'ELEC', description: undefined } },
      });
    });
  });

  describe('validateDeleteAdmissionType', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateDeleteAdmissionType('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Admission type abc is Invalid.'],
      });
    });

    it('should return an error when the tenant id is blank', () => {
      expect(validateDeleteAdmissionType('1', '  ')).toMatchObject({ success: false });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateDeleteAdmissionType('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetAdmissionTypeById', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateGetAdmissionTypeById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Admission type abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateGetAdmissionTypeById('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetAdmissionTypes', () => {
    it('should reject a blank tenant id', () => {
      expect(validateGetAdmissionTypes('  ')).toMatchObject({ success: false });
    });

    it('should return the trimmed tenant id on success', () => {
      expect(validateGetAdmissionTypes(' tenant-1 ')).toEqual({ success: true, data: 'tenant-1' });
    });
  });

  describe('getAdmissionTypeUniqueConstraintErrors', () => {
    it('should map the name constraint to the duplicate name error', () => {
      expect(
        getAdmissionTypeUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'admission_type_tenant_name_idx' } },
          { name: 'Emergency', code: 'EMER' }
        )
      ).toEqual(["Admission type name 'Emergency' already exists."]);
    });

    it('should map the code constraint to the duplicate code error', () => {
      expect(
        getAdmissionTypeUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'admission_type_tenant_code_idx' } },
          { name: 'Emergency', code: 'EMER' }
        )
      ).toEqual(["Admission type code 'EMER' already exists."]);
    });

    it('should return no errors for an unrelated database error', () => {
      expect(
        getAdmissionTypeUniqueConstraintErrors(
          { cause: { code: '23503' } },
          { name: 'Emergency', code: 'EMER' }
        )
      ).toEqual([]);
    });
  });
});
