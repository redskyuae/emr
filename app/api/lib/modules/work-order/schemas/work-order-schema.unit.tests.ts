import { describe, expect, it } from 'vitest';

import { createWorkOrderSchema, workOrderTenantIdSchema } from './work-order-schema';

const errorsOf = (result: ReturnType<typeof createWorkOrderSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const valid = { assetId: 1, typeId: 2, priorityId: 3, statusId: 4 };

describe('WorkOrder schema', () => {
  it('should require asset, type, priority and status ids', () => {
    expect(errorsOf(createWorkOrderSchema.safeParse({}))).toEqual(
      expect.arrayContaining([
        'Work order asset ID is required',
        'Work order type ID is required',
        'Work order priority ID is required',
        'Work order status ID is required',
      ])
    );
  });

  it('should reject a non-positive id', () => {
    expect(errorsOf(createWorkOrderSchema.safeParse({ ...valid, assetId: 0 }))).toContain(
      'Work order asset ID must be positive'
    );
  });

  it('should reject a malformed due date', () => {
    expect(
      errorsOf(createWorkOrderSchema.safeParse({ ...valid, dueDate: '12-31-2025' }))
    ).toContain('Work order due date must be a valid ISO date');
  });

  it('should reject a technician longer than 150 characters', () => {
    expect(
      errorsOf(createWorkOrderSchema.safeParse({ ...valid, technician: 'a'.repeat(151) }))
    ).toContain('Work order technician must be at most 150 characters');
  });

  it('should coerce ids and drop blank optionals', () => {
    const result = createWorkOrderSchema.safeParse({
      assetId: '1',
      typeId: '2',
      priorityId: '3',
      statusId: '4',
      technician: '   ',
      note: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assetId).toBe(1);
      expect(result.data.technician).toBeUndefined();
      expect(result.data.note).toBeUndefined();
    }
  });

  it('should validate the tenant id', () => {
    expect(workOrderTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(workOrderTenantIdSchema.safeParse('   ').success).toBe(false);
  });

  it('should trim technician and note, drop a null due date and strip server-managed fields', () => {
    expect(
      createWorkOrderSchema.parse({
        assetId: 12,
        typeId: 3,
        priorityId: 2,
        statusId: 4,
        technician: '  Vendor (Lumenis)  ',
        dueDate: null,
        note: '  Beam alignment fault  ',
        code: 'WO-0001',
        completedOn: '2026-06-27T10:00:00.000Z',
        tenantId: 'another-tenant',
      })
    ).toEqual({
      assetId: 12,
      typeId: 3,
      priorityId: 2,
      statusId: 4,
      technician: 'Vendor (Lumenis)',
      dueDate: undefined,
      note: 'Beam alignment fault',
    });
  });
});
