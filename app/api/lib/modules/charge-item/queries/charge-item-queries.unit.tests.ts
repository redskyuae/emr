import { beforeEach, describe, expect, it, vi } from 'vitest';

import { chargeItemRepository } from '../repository/charge-item-repository';
import { getChargeItemByIdQuery } from './get-charge-item-by-id-query';
import { getChargeItemsQuery } from './get-charge-items-query';

vi.mock('../repository/charge-item-repository', () => ({
  chargeItemRepository: { getChargeItemById: vi.fn(), getChargeItems: vi.fn() },
}));

const repo = vi.mocked(chargeItemRepository);

const chargeItem = {
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

describe('ChargeItem queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getChargeItemById.mockResolvedValue(chargeItem);
    repo.getChargeItems.mockResolvedValue({ data: [chargeItem], total: 1 });
  });

  describe('getChargeItemByIdQuery', () => {
    it('should short-circuit and not call the repository when validation fails', async () => {
      await expect(getChargeItemByIdQuery('abc', 'tenant-1')).resolves.toMatchObject({
        success: false,
        errors: ['Charge item abc is Invalid.'],
      });
      expect(repo.getChargeItemById).not.toHaveBeenCalled();
    });

    it('should return not found when the row is missing', async () => {
      repo.getChargeItemById.mockResolvedValue(undefined);

      await expect(getChargeItemByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
    });

    it('should return the charge item on success', async () => {
      await expect(getChargeItemByIdQuery('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: chargeItem,
      });
      expect(repo.getChargeItemById).toHaveBeenCalledWith(1, 'tenant-1');
    });
  });

  describe('getChargeItemsQuery', () => {
    it('should short-circuit and not call the repository when the tenant id is blank', async () => {
      const result = await getChargeItemsQuery({ tenantId: '  ' });

      expect(result.success).toBe(false);
      expect(repo.getChargeItems).not.toHaveBeenCalled();
    });

    it('should short-circuit on an unknown category filter', async () => {
      const result = await getChargeItemsQuery({ tenantId: 'tenant-1', category: 'SURGERY' });

      expect(result).toMatchObject({
        success: false,
        errors: ['Charge item category SURGERY is Invalid.'],
      });
      expect(repo.getChargeItems).not.toHaveBeenCalled();
    });

    it('should pass paging, search and filter params through to the repository', async () => {
      await getChargeItemsQuery({
        tenantId: 'tenant-1',
        page: 2,
        limit: 5,
        query: 'cons',
        category: 'CONSULTATION',
        isActive: true,
      });

      expect(repo.getChargeItems).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        category: 'CONSULTATION',
        page: 2,
        limit: 5,
        query: 'cons',
        isActive: true,
      });
    });

    it('should return the list query result shape', async () => {
      await expect(getChargeItemsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
        success: true,
        data: [chargeItem],
        total: 1,
      });
    });
  });
});
