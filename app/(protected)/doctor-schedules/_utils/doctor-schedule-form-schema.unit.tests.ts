import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { doctorScheduleFormSchema } from './doctor-schedule-form-schema';

const validSchedule = {
  doctorId: '2',
  rotaIds: [3],
  slotInMinute: '30',
  slotToDate: '2026-06-10',
  slotFromDate: '2026-06-01',
};

describe('doctorScheduleFormSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('should reject a past slot from date', () => {
    const result = doctorScheduleFormSchema.safeParse({
      ...validSchedule,
      slotFromDate: '2026-05-31',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ message: 'Slot from date cannot be in the past.' })
    );
  });
});
