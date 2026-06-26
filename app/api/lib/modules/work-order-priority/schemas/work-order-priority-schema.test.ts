import assert from 'node:assert/strict';

import { createWorkOrderPrioritySchema } from './work-order-priority-schema';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

describe('Work Order Priority schema', () => {
  test('normalizes create input for persistence', () => {
    const result = createWorkOrderPrioritySchema.safeParse({
      name: ' Critical ',
      code: ' crit ',
      color: '#dc2626',
      description: ' ',
    });

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.deepEqual(result.data, {
      name: 'Critical',
      code: 'CRIT',
      color: '#dc2626',
      description: undefined,
    });
  });

  test('rejects non-hex display colors with the domain message', () => {
    const result = createWorkOrderPrioritySchema.safeParse({
      name: 'Critical',
      code: 'CRIT',
      color: 'red',
    });

    assert.equal(result.success, false);

    if (result.success) {
      return;
    }

    assert(
      result.error.issues
        .map((issue) => issue.message)
        .includes('Work order priority color must be a hex value like #16A34A.')
    );
  });
});
