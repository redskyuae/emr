import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { therapistScheduleFormSchema } from './therapist-schedule-form-schema';

const validSchedule = {
  rotaIds: [3],
  therapistId: '2',
  slotInMinute: '30',
  slotToDate: '2026-06-10',
  slotFromDate: '2026-06-01',
};

describe('therapistScheduleFormSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('should reject a past slot from date', () => {
    const result = therapistScheduleFormSchema.safeParse({
      ...validSchedule,
      slotFromDate: '2026-05-31',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ message: 'Slot from date cannot be in the past.' })
    );
  });
});
