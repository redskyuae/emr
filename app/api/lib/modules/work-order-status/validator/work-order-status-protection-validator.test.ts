import assert from 'node:assert/strict';
import { StatusCodes } from 'http-status-codes';

import {
  validateSystemWorkOrderStatusDelete,
  validateSystemWorkOrderStatusUpdate,
} from './work-order-status-protection-validator';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

describe('System Work Order Status protection', () => {
  test('rejects system code and category changes with exact conflict messages', () => {
    const result = validateSystemWorkOrderStatusUpdate(
      { code: 'INPROG', category: 'IN_PROGRESS', isSystem: true },
      { code: 'ACTIVE', category: 'OPEN' }
    );

    assert.deepEqual(result, {
      success: false,
      errors: [
        'System work order status code cannot be changed.',
        'System work order status category cannot be changed.',
      ],
      status: StatusCodes.CONFLICT,
    });
  });

  test('allows display-only updates to a system status', () => {
    const result = validateSystemWorkOrderStatusUpdate(
      { code: 'INPROG', category: 'IN_PROGRESS', isSystem: true },
      { code: 'INPROG', category: 'IN_PROGRESS' }
    );

    assert.deepEqual(result, { success: true, data: undefined });
  });

  test('rejects system status deletion and allows tenant-defined status deletion', () => {
    assert.deepEqual(validateSystemWorkOrderStatusDelete({ isSystem: true }), {
      success: false,
      errors: ['System work order status cannot be deleted.'],
      status: StatusCodes.CONFLICT,
    });
    assert.deepEqual(validateSystemWorkOrderStatusDelete({ isSystem: false }), {
      success: true,
      data: undefined,
    });
  });
});
