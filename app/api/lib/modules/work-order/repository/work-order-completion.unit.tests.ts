import { describe, expect, it } from 'vitest';

import { initialCompletedOn } from './work-order-completion';

describe('initialCompletedOn', () => {
  const now = new Date('2026-06-27T10:00:00.000Z');

  it('should record the server time when a Work Order is created in the Completed category', () => {
    expect(initialCompletedOn('COMPLETED', now)).toBe(now);
  });

  it.each(['OPEN', 'IN_PROGRESS', 'SCHEDULED', 'OVERDUE'] as const)(
    'should leave completedOn empty for the %s category',
    (category) => {
      expect(initialCompletedOn(category, now)).toBeNull();
    }
  );
});
