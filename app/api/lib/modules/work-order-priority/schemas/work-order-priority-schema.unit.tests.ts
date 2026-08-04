import { describe, expect, it } from 'vitest';

import {
  workOrderPriorityIdSchema,
  workOrderPriorityTenantIdSchema,
  createWorkOrderPrioritySchema,
} from './work-order-priority-schema';

const errorsOf = (result: ReturnType<typeof createWorkOrderPrioritySchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('WorkOrderPriority schema', () => {
  it('should return validation error when name is missing', () => {
    expect(
      errorsOf(createWorkOrderPrioritySchema.safeParse({ code: 'GD', color: '#16A34A' }))
    ).toContain('Work order priority name is required');
  });

  it('should return validation error when name is empty after trimming', () => {
    expect(
      errorsOf(
        createWorkOrderPrioritySchema.safeParse({ name: '   ', code: 'GD', color: '#16A34A' })
      )
    ).toContain('Work order priority name cannot be empty');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(
        createWorkOrderPrioritySchema.safeParse({
          name: 'a'.repeat(101),
          code: 'GD',
          color: '#16A34A',
        })
      )
    ).toContain('Work order priority name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createWorkOrderPrioritySchema.safeParse({ name: 'Good', color: '#16A34A' }))
    ).toContain('Work order priority code is required');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(
        createWorkOrderPrioritySchema.safeParse({
          name: 'Good',
          code: 'A'.repeat(11),
          color: '#16A34A',
        })
      )
    ).toContain('Work order priority code must be at most 10 characters');
  });

  it('should return validation error when color is missing', () => {
    expect(
      errorsOf(createWorkOrderPrioritySchema.safeParse({ name: 'Good', code: 'GD' }))
    ).toContain('Work order priority color is required');
  });

  it('should return validation error when color is not a valid hex value', () => {
    expect(
      errorsOf(
        createWorkOrderPrioritySchema.safeParse({ name: 'Good', code: 'GD', color: 'green' })
      )
    ).toContain('Work order priority color must be a hex value like #16A34A.');
  });

  it('should uppercase code on successful parse', () => {
    expect(
      createWorkOrderPrioritySchema.parse({ name: 'Good', code: 'gd', color: '#16A34A' }).code
    ).toBe('GD');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createWorkOrderPrioritySchema.parse({
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
      createWorkOrderPrioritySchema.parse({
        name: 'Good',
        code: 'GD',
        color: '#16A34A',
        description: '   ',
      }).description
    ).toBeUndefined();
  });

  it('should return validation error when description exceeds 500 characters', () => {
    expect(
      errorsOf(
        createWorkOrderPrioritySchema.safeParse({
          name: 'High',
          code: 'HIGH',
          color: '#16A34A',
          description: 'a'.repeat(501),
        })
      )
    ).toContain('Work order priority description must be at most 500 characters');
  });

  it('should validate work order priority id is positive integer', () => {
    expect(workOrderPriorityIdSchema.safeParse('1').success).toBe(true);
    expect(workOrderPriorityIdSchema.safeParse('0').success).toBe(false);
    expect(workOrderPriorityIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(workOrderPriorityTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(workOrderPriorityTenantIdSchema.safeParse('   ').success).toBe(false);
  });

  it('should reject unsupported characters in name and code', () => {
    expect(
      errorsOf(
        createWorkOrderPrioritySchema.safeParse({
          name: 'In.Person',
          code: 'INP',
          color: '#16A34A',
        })
      )
    ).toContain(
      'Work order priority name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(
      errorsOf(
        createWorkOrderPrioritySchema.safeParse({
          name: 'In Person',
          code: 'IN.P',
          color: '#16A34A',
        })
      )
    ).toContain(
      'Work order priority code must contain only letters, numbers, hyphens, and underscores.'
    );
  });
});
