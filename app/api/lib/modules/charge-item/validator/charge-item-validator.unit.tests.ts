import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { chargeItemRepository } from '../repository/charge-item-repository';
import { validateCreateChargeItem } from './create-charge-item-validator';
import { validateDeleteChargeItem } from './delete-charge-item-validator';
import { validateGetChargeItemById } from './get-charge-item-by-id-validator';
import { validateGetChargeItems } from './get-charge-items-validator';
import { validateUpdateChargeItem } from './update-charge-item-validator';
import { getChargeItemUniqueConstraintErrors } from './charge-item-uniqueness-validator';

vi.mock('../repository/charge-item-repository', () => ({
  chargeItemRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getChargeItemById: vi.fn(),
  },
}));

const repo = vi.mocked(chargeItemRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'General Consultation',
  code: 'CONS',
  category: 'CONSULTATION' as const,
  unitPrice: 500,
  isActive: true,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

const validPayload = {
  name: 'General Consultation',
  code: 'CONS',
  category: 'CONSULTATION',
  unitPrice: 500,
};

describe('ChargeItem validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getChargeItemById.mockResolvedValue(existing);
  });

  describe('validateCreateChargeItem', () => {
    it('should not call uniqueness checks when schema parsing fails', async () => {
      const result = await validateCreateChargeItem({}, 'tenant-1');

      expect(result.success).toBe(false);
      expect(repo.findActiveByName).not.toHaveBeenCalled();
      expect(repo.findActiveByCode).not.toHaveBeenCalled();
    });

    it('should return the parsed data when the charge item is unique', async () => {
      const result = await validateCreateChargeItem({ ...validPayload, code: 'cons' }, 'tenant-1');

      expect(result).toMatchObject({
        success: true,
        data: {
          name: 'General Consultation',
          code: 'CONS',
          category: 'CONSULTATION',
          unitPrice: 500,
        },
      });
    });

    it('should return conflict when the name already exists for the tenant', async () => {
      repo.findActiveByName.mockResolvedValue(existing);

      const result = await validateCreateChargeItem(validPayload, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Charge item name General Consultation already exists.'],
      });
    });

    it('should return conflict when the code already exists for the tenant', async () => {
      repo.findActiveByCode.mockResolvedValue(existing);

      const result = await validateCreateChargeItem(validPayload, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        status: StatusCodes.CONFLICT,
        errors: ['Charge item code CONS already exists.'],
      });
    });
  });

  describe('validateUpdateChargeItem', () => {
    it('should return an invalid id error for a non-numeric id', async () => {
      const result = await validateUpdateChargeItem('abc', validPayload, 'tenant-1');

      expect(result).toMatchObject({
        success: false,
        errors: ['Charge item abc is Invalid.'],
      });
      expect(repo.getChargeItemById).not.toHaveBeenCalled();
    });

    it('should return not found when the charge item does not exist', async () => {
      repo.getChargeItemById.mockResolvedValue(undefined);

      const result = await validateUpdateChargeItem('1', validPayload, 'tenant-1');

      expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
    });

    it('should pass excludeId to the uniqueness check', async () => {
      await validateUpdateChargeItem('7', validPayload, 'tenant-1');

      expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'General Consultation', {
        excludeId: 7,
      });
      expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'CONS', { excludeId: 7 });
    });

    it('should return the id and parsed payload on success', async () => {
      const result = await validateUpdateChargeItem('7', validPayload, 'tenant-1');

      expect(result).toMatchObject({
        success: true,
        data: { id: 7, payload: { name: 'General Consultation', code: 'CONS' } },
      });
    });
  });

  describe('validateDeleteChargeItem', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateDeleteChargeItem('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Charge item abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateDeleteChargeItem('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetChargeItemById', () => {
    it('should return an invalid id error for a non-numeric id', () => {
      expect(validateGetChargeItemById('abc', 'tenant-1')).toMatchObject({
        success: false,
        errors: ['Charge item abc is Invalid.'],
      });
    });

    it('should return the id and tenant id on success', () => {
      expect(validateGetChargeItemById('1', 'tenant-1')).toEqual({
        success: true,
        data: { id: 1, tenantId: 'tenant-1' },
      });
    });
  });

  describe('validateGetChargeItems', () => {
    it('should reject a blank tenant id', () => {
      expect(validateGetChargeItems('  ', undefined)).toMatchObject({ success: false });
    });

    it('should reject an unknown category filter', () => {
      expect(validateGetChargeItems('tenant-1', 'SURGERY')).toMatchObject({
        success: false,
        errors: ['Charge item category SURGERY is Invalid.'],
      });
    });

    it('should treat a blank category as no filter', () => {
      expect(validateGetChargeItems('tenant-1', '')).toEqual({
        success: true,
        data: { tenantId: 'tenant-1', category: undefined },
      });
    });

    it('should return the tenant id and parsed category on success', () => {
      expect(validateGetChargeItems('tenant-1', 'BED')).toEqual({
        success: true,
        data: { tenantId: 'tenant-1', category: 'BED' },
      });
    });
  });

  describe('getChargeItemUniqueConstraintErrors', () => {
    it('should map the name constraint to the duplicate name error', () => {
      expect(
        getChargeItemUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'charge_item_tenant_name_idx' } },
          { name: 'General Consultation', code: 'CONS' }
        )
      ).toEqual(['Charge item name General Consultation already exists.']);
    });

    it('should map the code constraint to the duplicate code error', () => {
      expect(
        getChargeItemUniqueConstraintErrors(
          { cause: { code: '23505', constraint: 'charge_item_tenant_code_idx' } },
          { name: 'General Consultation', code: 'CONS' }
        )
      ).toEqual(['Charge item code CONS already exists.']);
    });

    it('should return no errors for an unrelated database error', () => {
      expect(
        getChargeItemUniqueConstraintErrors(
          { cause: { code: '23503' } },
          { name: 'General Consultation', code: 'CONS' }
        )
      ).toEqual([]);
    });
  });
});
