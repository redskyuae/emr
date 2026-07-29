import { describe, expect, it } from 'vitest';

import {
  createWorkOrderStatusSchema,
  workOrderStatusIdSchema,
  workOrderStatusTenantIdSchema,
} from './work-order-status-schema';

const errorsOf = (result: ReturnType<typeof createWorkOrderStatusSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const valid = { name: 'Open', code: 'OPN', color: '#16A34A', category: 'OPEN' };

describe('WorkOrderStatus schema', () => {
  it('should return validation error when name is missing', () => {
    expect(
      errorsOf(createWorkOrderStatusSchema.safeParse({ ...valid, name: undefined }))
    ).toContain('Work order status name is required');
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createWorkOrderStatusSchema.safeParse({ ...valid, name: 'a'.repeat(101) }))
    ).toContain('Work order status name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(
      errorsOf(createWorkOrderStatusSchema.safeParse({ ...valid, code: undefined }))
    ).toContain('Work order status code is required');
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createWorkOrderStatusSchema.safeParse({ ...valid, code: 'A'.repeat(11) }))
    ).toContain('Work order status code must be at most 10 characters');
  });

  it('should return validation error when color is not a valid hex value', () => {
    expect(errorsOf(createWorkOrderStatusSchema.safeParse({ ...valid, color: 'green' }))).toContain(
      'Work order status color must be a hex value like #16A34A.'
    );
  });

  it('should return validation error when category is not one of the allowed values', () => {
    expect(
      errorsOf(createWorkOrderStatusSchema.safeParse({ ...valid, category: 'PENDING' }))
    ).toContain(
      'Work order status category must be one of OPEN, IN_PROGRESS, SCHEDULED, COMPLETED, or OVERDUE.'
    );
  });

  it('should accept each allowed category value', () => {
    for (const category of ['OPEN', 'IN_PROGRESS', 'SCHEDULED', 'COMPLETED', 'OVERDUE']) {
      expect(createWorkOrderStatusSchema.safeParse({ ...valid, category }).success).toBe(true);
    }
  });

  it('should uppercase code on successful parse', () => {
    expect(createWorkOrderStatusSchema.parse({ ...valid, code: 'opn' }).code).toBe('OPN');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createWorkOrderStatusSchema.parse({
        name: ' Open ',
        code: ' opn ',
        color: '#16A34A',
        category: 'OPEN',
        description: ' Newly created ',
      })
    ).toEqual({
      name: 'Open',
      code: 'OPN',
      color: '#16A34A',
      category: 'OPEN',
      description: 'Newly created',
    });
  });

  it('should transform empty description to undefined', () => {
    expect(
      createWorkOrderStatusSchema.parse({ ...valid, description: '   ' }).description
    ).toBeUndefined();
  });

  it('should return validation error when description exceeds 500 characters', () => {
    expect(
      errorsOf(createWorkOrderStatusSchema.safeParse({ ...valid, description: 'a'.repeat(501) }))
    ).toContain('Work order status description must be at most 500 characters');
  });

  it('should validate work order status id is positive integer', () => {
    expect(workOrderStatusIdSchema.safeParse('1').success).toBe(true);
    expect(workOrderStatusIdSchema.safeParse('0').success).toBe(false);
    expect(workOrderStatusIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(workOrderStatusTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(workOrderStatusTenantIdSchema.safeParse('   ').success).toBe(false);
  });

  it('should reject unsupported characters in name and code', () => {
    expect(
      errorsOf(
        createWorkOrderStatusSchema.safeParse({
          name: 'In.Person',
          code: 'INP',
          color: '#16A34A',
          category: 'OPEN',
        })
      )
    ).toContain(
      'Work order status name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(
      errorsOf(
        createWorkOrderStatusSchema.safeParse({
          name: 'In Person',
          code: 'IN.P',
          color: '#16A34A',
          category: 'OPEN',
        })
      )
    ).toContain(
      'Work order status code must contain only letters, numbers, hyphens, and underscores.'
    );
  });
});
