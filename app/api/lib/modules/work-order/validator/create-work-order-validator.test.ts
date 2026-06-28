import assert from 'node:assert/strict';
import { StatusCodes } from 'http-status-codes';

import { validateCreateWorkOrder } from './create-work-order-validator';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => Promise<void>): void;

describe('Create Work Order validation', () => {
  test('reports every invalid tenant-scoped reference with exact messages', async () => {
    const result = await validateCreateWorkOrder(
      { assetId: 999, typeId: 998, priorityId: 997, statusId: 996 },
      'tenant-a',
      {
        getAssetById: async () => undefined,
        getWorkOrderTypeById: async () => undefined,
        getWorkOrderPriorityById: async () => undefined,
        getWorkOrderStatusById: async () => undefined,
      }
    );

    assert.deepEqual(result, {
      success: false,
      errors: [
        'Asset 999 is Invalid.',
        'Work order type 998 is Invalid.',
        'Work order priority 997 is Invalid.',
        'Work order status 996 is Invalid.',
      ],
      status: StatusCodes.CONFLICT,
    });
  });
});
