import assert from 'node:assert/strict';

import { formatWorkOrderCode } from './work-order-code';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

describe('Work Order code', () => {
  test('formats a minimum four-digit tenant sequence', () => {
    assert.equal(formatWorkOrderCode(42), 'WO-0042');
    assert.equal(formatWorkOrderCode(1001), 'WO-1001');
    assert.equal(formatWorkOrderCode(10000), 'WO-10000');
  });
});
