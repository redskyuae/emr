import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitTypeRepository } from '../repository/visit-type-repository';
import { validateCreateVisitType } from './create-visit-type-validator';
import { validateDeleteVisitType } from './delete-visit-type-validator';
import { validateGetVisitTypeById } from './get-visit-type-by-id-validator';
import { validateGetVisitTypes } from './get-visit-types-validator';
import { validateUpdateVisitType } from './update-visit-type-validator';
import { getVisitTypeUniqueConstraintErrors } from './visit-type-uniqueness-validator';

vi.mock('../repository/visit-type-repository', () => ({
  visitTypeRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getVisitTypeById: vi.fn(),
  },
}));

const repo = vi.mocked(visitTypeRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'OPD Consultation',
  code: 'OPD',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('VisitType validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getVisitTypeById.mockResolvedValue(existing);
  });

  describe('validateCreateVisitType', () => {
    it('should not call uniqueness checks when schema parsing fails', async () => {
      const result = await validateCreateVisitType({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(repo.findActiveByName).not.toHaveBeenCalled();
      expect(repo.findActiveByCode).not.toHaveBeenCalled();
    });

    it('should return the parsed data when the visit type is unique', async () => {
      const result = await validateCreateVisitType(
        { name: ' OPD Consultation ', code: 'opd' },
        'tenant-1'
      );

      expect(result).toEqual({
        success: true,
        data: { name: 'OPD Consultation', code: 'OPD', description: undefined },
      });
    });

    it('should return conflict when the name already exists for the tenant', async () => {
      repo.findActiveByName.mockResolvedValue(existing);

      const result = await validateCreateVisitType(
        { name: 'OPD Consultation', code: 'OPD' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Visit type name 'OPD Consultation' already exists."],
      });
    });

    it('should return conflict when the code already exists for the tenant', async () => {
      repo.findActiveByCode.mockResolvedValue(existing);

      const result = await validateCreateVisitType({ name: 'Follow-up', code: 'opd' }, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ["Visit type code 'OPD' already exists."],
      });
    });
  });

  describe('validateUpdateVisitType', () => {
    it('should return an invalid id error for a non-numeric id', async () => {
      const result = await validateUpdateVisitType(
        'abc',
        { name: 'OPD Consultation', code: 'OPD' },
        'tenant-1'
      );

      expect(result).toMatchObject({
        success: false,
        errors: ['Visit type abc is Invalid.'],
      });
      expect(repo.getVisitTypeById).not.toHaveBeenCalled();
    });

    it('should return not found when the visit type does not exist', async () => {
      repo.getVisitTypeById.mockResolvedValue(undefined);

      const result = await validateUpdateVisitType(
        '1',
        { name: 'OPD Consultation', code: 'OPD' },
        'tenant-1'
      );

      expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
    });

    it('should pass excludeId to the uniqueness check', async () => {
      await validateUpdateVisitType('7', { name: 'Follow-up', code: 'fup' }, 'tenant-1');

      expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Follow-up', { excludeId: 7 });
      expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'FUP', { excludeId: 7 });
    });

    it('should return the id and parsed payload on success', async () => {
      const result = await validateUpdateVisitType(
        '7',
        { name: 'Follow-up', code: 'fup' },
        'tenant-1'
      );

      expect(result).toEqual({
        success: true,
        data: { id: 7, payload: { name: 'Follow-up', code: 'FUP', description: undefined } },
      });
    });
  });

  describe('validateDeleteVisitType', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateDeleteVisitType('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Visit type abc is Invalid.'],
      });
    });

    it('should return an error when the tenant id is blank', () => {
      expect(validateDeleteVisitType('1', '  ')).toMatchObject({ success: false });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateDeleteVisitType('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetVisitTypeById', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateGetVisitTypeById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Visit type abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateGetVisitTypeById('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetVisitTypes', () => {
    it('should reject a blank tenant id', () => {
      expect(validateGetVisitTypes('  ')).toMatchObject({ success: false });
    });

    it('should return the trimmed tenant id on success', () => {
      expect(validateGetVisitTypes(' tenant-1 ')).toEqual({ success: true, data: 'tenant-1' });
    });
  });

  describe('getVisitTypeUniqueConstraintErrors', () => {
    it('should map the name constraint to the duplicate name error', () => {
      expect(
        getVisitTypeUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'visit_type_tenant_name_idx' } },
          { name: 'OPD Consultation', code: 'OPD' }
        )
      ).toEqual(["Visit type name 'OPD Consultation' already exists."]);
    });

    it('should map the code constraint to the duplicate code error', () => {
      expect(
        getVisitTypeUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'visit_type_tenant_code_idx' } },
          { name: 'OPD Consultation', code: 'OPD' }
        )
      ).toEqual(["Visit type code 'OPD' already exists."]);
    });

    it('should return no errors for an unrelated database error', () => {
      expect(
        getVisitTypeUniqueConstraintErrors(
          { cause: { code: '23503' } },
          { name: 'OPD Consultation', code: 'OPD' }
        )
      ).toEqual([]);
    });
  });
});
