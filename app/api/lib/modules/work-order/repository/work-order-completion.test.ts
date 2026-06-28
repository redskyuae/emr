import assert from 'node:assert/strict';

import { initialCompletedOn } from './work-order-completion';

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

describe('Work Order completion', () => {
  test('records server time only when created in the Completed category', () => {
    const now = new Date('2026-06-27T10:00:00.000Z');

    assert.equal(initialCompletedOn('COMPLETED', now), now);
    assert.equal(initialCompletedOn('OPEN', now), null);
    assert.equal(initialCompletedOn('IN_PROGRESS', now), null);
  });
});
