import { describe, expect, it } from 'vitest';

import {
  assetStatusIdSchema,
  assetStatusTenantIdSchema,
  createAssetStatusSchema,
} from './asset-status-schema';

const errorsOf = (result: ReturnType<typeof createAssetStatusSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AssetStatus schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createAssetStatusSchema.safeParse({ code: 'GD', color: '#16A34A' }))).toContain(
      'Asset status name is required'
    );
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(createAssetStatusSchema.safeParse({ name: '   ', code: 'GD', color: '#16A34A' }))
    ).toContain('Asset status name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(
        createAssetStatusSchema.safeParse({
          name: 'a'.repeat(101),
          code: 'GD',
          color: '#16A34A',
        })
      )
    ).toContain('Asset status name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createAssetStatusSchema.safeParse({ name: 'Good', color: '#16A34A' }))
    ).toContain('Asset status code is required');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(
        createAssetStatusSchema.safeParse({
          name: 'Good',
          code: 'A'.repeat(11),
          color: '#16A34A',
        })
      )
    ).toContain('Asset status code must be at most 10 characters');
  });

  it('should return validation error when color is missing', () => {
    expect(errorsOf(createAssetStatusSchema.safeParse({ name: 'Good', code: 'GD' }))).toContain(
      'Asset status color is required'
    );
  });

  it('should return validation error when color is not a valid hex value', () => {
    expect(
      errorsOf(createAssetStatusSchema.safeParse({ name: 'Good', code: 'GD', color: 'green' }))
    ).toContain('Asset status color must be a hex value like #16A34A.');
  });

  it('should uppercase code on successful parse', () => {
    expect(createAssetStatusSchema.parse({ name: 'Good', code: 'gd', color: '#16A34A' }).code).toBe(
      'GD'
    );
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createAssetStatusSchema.parse({
        name: ' Good ',
        code: ' gd ',
        color: '#16A34A',
        description: ' Working ',
      })
    ).toEqual({
      name: 'Good',
      code: 'GD',
      color: '#16A34A',
      description: 'Working',
    });
  });

  it('should transform empty description to undefined', () => {
    expect(
      createAssetStatusSchema.parse({
        name: 'Good',
        code: 'GD',
        color: '#16A34A',
        description: '   ',
      }).description
    ).toBeUndefined();
  });

  it('should validate asset status id is positive integer', () => {
    expect(assetStatusIdSchema.safeParse('1').success).toBe(true);
    expect(assetStatusIdSchema.safeParse('0').success).toBe(false);
    expect(assetStatusIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(assetStatusTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(assetStatusTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
