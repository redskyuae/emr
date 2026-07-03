import { describe, expect, it } from 'vitest';

import {
  workOrderTypeIdSchema,
  workOrderTypeTenantIdSchema,
  createWorkOrderTypeSchema,
} from './work-order-type-schema';

const errorsOf = (result: ReturnType<typeof createWorkOrderTypeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('WorkOrderType schema', () => {
  it('should return validation error when name is missing', () => {
    expect(
      errorsOf(createWorkOrderTypeSchema.safeParse({ code: 'GD', color: '#16A34A' }))
    ).toContain('Work order type name is required');
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(createWorkOrderTypeSchema.safeParse({ name: '   ', code: 'GD', color: '#16A34A' }))
    ).toContain('Work order type name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(
        createWorkOrderTypeSchema.safeParse({
          name: 'a'.repeat(101),
          code: 'GD',
          color: '#16A34A',
        })
      )
    ).toContain('Work order type name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createWorkOrderTypeSchema.safeParse({ name: 'Good', color: '#16A34A' }))
    ).toContain('Work order type code is required');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(
        createWorkOrderTypeSchema.safeParse({
          name: 'Good',
          code: 'A'.repeat(11),
          color: '#16A34A',
        })
      )
    ).toContain('Work order type code must be at most 10 characters');
  });

  it('should return validation error when color is missing', () => {
    expect(errorsOf(createWorkOrderTypeSchema.safeParse({ name: 'Good', code: 'GD' }))).toContain(
      'Work order type color is required'
    );
  });

  it('should return validation error when color is not a valid hex value', () => {
    expect(
      errorsOf(createWorkOrderTypeSchema.safeParse({ name: 'Good', code: 'GD', color: 'green' }))
    ).toContain('Work order type color must be a hex value like #16A34A.');
  });

  it('should uppercase code on successful parse', () => {
    expect(
      createWorkOrderTypeSchema.parse({ name: 'Good', code: 'gd', color: '#16A34A' }).code
    ).toBe('GD');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createWorkOrderTypeSchema.parse({
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
      createWorkOrderTypeSchema.parse({
        name: 'Good',
        code: 'GD',
        color: '#16A34A',
        description: '   ',
      }).description
    ).toBeUndefined();
  });

  it('should validate work order type id is positive integer', () => {
    expect(workOrderTypeIdSchema.safeParse('1').success).toBe(true);
    expect(workOrderTypeIdSchema.safeParse('0').success).toBe(false);
    expect(workOrderTypeIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(workOrderTypeTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(workOrderTypeTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
