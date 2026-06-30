import { describe, expect, it } from 'vitest';

import {
  assetCategoryIdSchema,
  assetCategoryTenantIdSchema,
  createAssetCategorySchema,
} from './asset-category-schema';

const errorsOf = (result: ReturnType<typeof createAssetCategorySchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AssetCategory schema', () => {
  it('should return validation error when name is missing', () => {
    expect(
      errorsOf(createAssetCategorySchema.safeParse({ code: 'GD', color: '#2563EB' }))
    ).toContain('Asset category name is required');
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(createAssetCategorySchema.safeParse({ name: '   ', code: 'GD', color: '#2563EB' }))
    ).toContain('Asset category name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(
        createAssetCategorySchema.safeParse({
          name: 'a'.repeat(101),
          code: 'GD',
          color: '#2563EB',
        })
      )
    ).toContain('Asset category name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createAssetCategorySchema.safeParse({ name: 'Good', color: '#2563EB' }))
    ).toContain('Asset category code is required');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(
        createAssetCategorySchema.safeParse({
          name: 'Good',
          code: 'A'.repeat(11),
          color: '#2563EB',
        })
      )
    ).toContain('Asset category code must be at most 10 characters');
  });

  it('should return validation error when color is missing', () => {
    expect(errorsOf(createAssetCategorySchema.safeParse({ name: 'Good', code: 'GD' }))).toContain(
      'Asset category color is required'
    );
  });

  it('should return validation error when color is not a valid hex value', () => {
    expect(
      errorsOf(createAssetCategorySchema.safeParse({ name: 'Good', code: 'GD', color: 'green' }))
    ).toContain('Asset category color must be a hex value like #2563EB.');
  });

  it('should uppercase code on successful parse', () => {
    expect(
      createAssetCategorySchema.parse({ name: 'Good', code: 'gd', color: '#2563EB' }).code
    ).toBe('GD');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createAssetCategorySchema.parse({
        name: ' Good ',
        code: ' gd ',
        color: '#2563EB',
        description: ' Working ',
      })
    ).toEqual({
      name: 'Good',
      code: 'GD',
      color: '#2563EB',
      description: 'Working',
    });
  });

  it('should transform empty description to undefined', () => {
    expect(
      createAssetCategorySchema.parse({
        name: 'Good',
        code: 'GD',
        color: '#2563EB',
        description: '   ',
      }).description
    ).toBeUndefined();
  });

  it('should validate asset category id is positive integer', () => {
    expect(assetCategoryIdSchema.safeParse('1').success).toBe(true);
    expect(assetCategoryIdSchema.safeParse('0').success).toBe(false);
    expect(assetCategoryIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(assetCategoryTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(assetCategoryTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
