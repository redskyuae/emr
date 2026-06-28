import assert from 'node:assert/strict';
import { StatusCodes } from 'http-status-codes';

import { validateDeleteWorkOrderType } from './delete-work-order-type-validator';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => Promise<void>): void;

describe('Delete Work Order Type validation', () => {
  test('rejects deletion when a non-deleted Work Order uses the Type', async () => {
    const result = await validateDeleteWorkOrderType(12, 'tenant-a', {
      isTypeInUse: async () => true,
    });

    assert.deepEqual(result, {
      success: false,
      errors: ['Work order type cannot be deleted while it is in use.'],
      status: StatusCodes.CONFLICT,
    });
  });
});
