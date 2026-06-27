import assert from 'node:assert/strict';

import { createWorkOrderStatusSchema } from './work-order-status-schema';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

describe('Work Order Status schema', () => {
  test('normalizes create input and does not accept client-controlled system state', () => {
    const result = createWorkOrderStatusSchema.safeParse({
      name: ' In Progress ',
      code: ' inprog ',
      category: 'IN_PROGRESS',
      color: '#2563eb',
      description: ' ',
      isSystem: true,
    });

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.deepEqual(result.data, {
      name: 'In Progress',
      code: 'INPROG',
      category: 'IN_PROGRESS',
      color: '#2563eb',
      description: undefined,
    });
  });

  test('rejects unsupported categories with the domain message', () => {
    const result = createWorkOrderStatusSchema.safeParse({
      name: 'Cancelled',
      code: 'CANCEL',
      category: 'CANCELLED',
      color: '#6B7280',
    });

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert(
      result.error.issues
        .map((issue) => issue.message)
        .includes(
          'Work order status category must be one of OPEN, IN_PROGRESS, SCHEDULED, COMPLETED, or OVERDUE.'
        )
    );
  });

  test('rejects non-hex display colors with the domain message', () => {
    const result = createWorkOrderStatusSchema.safeParse({
      name: 'In Progress',
      code: 'INPROG',
      category: 'IN_PROGRESS',
      color: 'blue',
    });

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert(
      result.error.issues
        .map((issue) => issue.message)
        .includes('Work order status color must be a hex value like #16A34A.')
    );
  });
});
