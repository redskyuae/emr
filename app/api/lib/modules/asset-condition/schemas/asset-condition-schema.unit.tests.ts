import { describe, expect, it } from 'vitest';

import {
  assetConditionIdSchema,
  assetConditionTenantIdSchema,
  createAssetConditionSchema,
} from './asset-condition-schema';

const errorsOf = (result: ReturnType<typeof createAssetConditionSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('AssetCondition schema', () => {
  it('should return validation error when name is missing', () => {
    expect(
      errorsOf(createAssetConditionSchema.safeParse({ code: 'GD', color: '#16A34A' }))
    ).toContain('Asset condition name is required');
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(createAssetConditionSchema.safeParse({ name: '   ', code: 'GD', color: '#16A34A' }))
    ).toContain('Asset condition name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(
        createAssetConditionSchema.safeParse({
          name: 'a'.repeat(101),
          code: 'GD',
          color: '#16A34A',
        })
      )
    ).toContain('Asset condition name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createAssetConditionSchema.safeParse({ name: 'Good', color: '#16A34A' }))
    ).toContain('Asset condition code is required');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(
        createAssetConditionSchema.safeParse({
          name: 'Good',
          code: 'A'.repeat(11),
          color: '#16A34A',
        })
      )
    ).toContain('Asset condition code must be at most 10 characters');
  });

  it('should return validation error when color is missing', () => {
    expect(errorsOf(createAssetConditionSchema.safeParse({ name: 'Good', code: 'GD' }))).toContain(
      'Asset condition color is required'
    );
  });

  it('should return validation error when color is not a valid hex value', () => {
    expect(
      errorsOf(createAssetConditionSchema.safeParse({ name: 'Good', code: 'GD', color: 'green' }))
    ).toContain('Asset condition color must be a hex value like #16A34A.');
  });

  it('should uppercase code on successful parse', () => {
    expect(
      createAssetConditionSchema.parse({ name: 'Good', code: 'gd', color: '#16A34A' }).code
    ).toBe('GD');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createAssetConditionSchema.parse({
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
      createAssetConditionSchema.parse({
        name: 'Good',
        code: 'GD',
        color: '#16A34A',
        description: '   ',
      }).description
    ).toBeUndefined();
  });

  it('should validate asset condition id is positive integer', () => {
    expect(assetConditionIdSchema.safeParse('1').success).toBe(true);
    expect(assetConditionIdSchema.safeParse('0').success).toBe(false);
    expect(assetConditionIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(assetConditionTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(assetConditionTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
