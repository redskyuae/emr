import { describe, expect, it } from 'vitest';

import { assetIdSchema, assetTenantIdSchema, createAssetSchema } from './asset-schema';

const errorsOf = (result: ReturnType<typeof createAssetSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const valid = { name: 'MRI Scanner', categoryId: 1, statusId: 2, serialNumber: 'SN-1' };

describe('Asset schema', () => {
  it('should require name, category, status and serial number', () => {
    expect(errorsOf(createAssetSchema.safeParse({}))).toEqual(
      expect.arrayContaining([
        'Asset name is required',
        'Asset category ID is required',
        'Asset status ID is required',
        'Asset serial number is required',
      ])
    );
  });

  it('should reject a name longer than 150 characters', () => {
    expect(errorsOf(createAssetSchema.safeParse({ ...valid, name: 'a'.repeat(151) }))).toContain(
      'Asset name must be at most 150 characters'
    );
  });

  it('should reject a non-positive category id', () => {
    expect(errorsOf(createAssetSchema.safeParse({ ...valid, categoryId: 0 }))).toContain(
      'Asset category ID must be positive'
    );
  });

  it('should reject a malformed date field', () => {
    expect(
      errorsOf(createAssetSchema.safeParse({ ...valid, purchaseDate: '01-01-2020' }))
    ).toContain('Asset purchaseDate must be a valid ISO date');
  });

  it('should reject a negative monetary value', () => {
    expect(errorsOf(createAssetSchema.safeParse({ ...valid, cost: -5 }))).toContain(
      'Asset cost must be non-negative'
    );
  });

  it('should coerce master ids and drop blank optionals', () => {
    const result = createAssetSchema.safeParse({
      ...valid,
      categoryId: '1',
      conditionId: '',
      manufacturer: '   ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryId).toBe(1);
      expect(result.data.conditionId).toBeUndefined();
      expect(result.data.manufacturer).toBeUndefined();
    }
  });

  it('should validate asset id and tenant id', () => {
    expect(assetIdSchema.safeParse('1').success).toBe(true);
    expect(assetIdSchema.safeParse('0').success).toBe(false);
    expect(assetTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(assetTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
