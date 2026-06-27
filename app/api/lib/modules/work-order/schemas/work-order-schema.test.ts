import assert from 'node:assert/strict';

import { createWorkOrderSchema } from './work-order-schema';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

describe('Work Order schema', () => {
  test('normalizes create input and strips server-managed fields', () => {
    const result = createWorkOrderSchema.safeParse({
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
    });

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.deepEqual(result.data, {
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
