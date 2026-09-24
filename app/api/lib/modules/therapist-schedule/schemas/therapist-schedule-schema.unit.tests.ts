import { describe, expect, it } from 'vitest';

import {
  createTherapistScheduleSchema,
  therapistScheduleListParamsSchema,
  updateTherapistScheduleSchema,
} from './therapist-schedule-schema';

const errorsOf = (result: ReturnType<typeof createTherapistScheduleSchema.safeParse>) =>
  result.success ? [] : result.error.issues.map(({ message }) => message);

describe('TherapistSchedule schema', () => {
  it('should parse create input and normalize the slot duration', () => {
    expect(
      createTherapistScheduleSchema.parse({
        therapistId: '4',
        rotaIds: ['1', '2'],
        slotInMinute: '00:30',
        slotFromDate: '2026-09-24',
        slotToDate: '2026-09-30',
      })
    ).toEqual({
      therapistId: 4,
      rotaIds: [1, 2],
      slotFromDate: '2026-09-24',
      slotToDate: '2026-09-30',
      slotDurationMinutes: 30,
    });
  });

  it('should require all create fields', () => {
    expect(errorsOf(createTherapistScheduleSchema.safeParse({}))).toEqual(
      expect.arrayContaining([
        'Therapist ID is required',
        'Rota is required',
        'Slot duration is required',
        'Slot from date is required',
        'Slot to date is required',
      ])
    );
  });

  it('should reject duplicate rotas and invalid duration', () => {
    const result = createTherapistScheduleSchema.safeParse({
      therapistId: 4,
      rotaIds: [1, 1],
      slotInMinute: 1441,
      slotFromDate: '2026-09-30',
      slotToDate: '2026-09-24',
    });
    expect(errorsOf(result)).toEqual(
      expect.arrayContaining([
        'Rota IDs must be unique',
        'Slot duration must be at most 1440 minutes',
      ])
    );
  });

  it('should reject reversed dates', () => {
    expect(
      errorsOf(
        createTherapistScheduleSchema.safeParse({
          therapistId: 4,
          rotaIds: [1],
          slotInMinute: 30,
          slotFromDate: '2026-09-30',
          slotToDate: '2026-09-24',
        })
      )
    ).toContain('Slot to date must be on or after slot from date');
  });

  it('should require an update field and rota ids with rota type', () => {
    expect(
      updateTherapistScheduleSchema
        .safeParse({ therapistScheduleId: 1 })
        .error?.issues.map(({ message }) => message)
    ).toContain('At least one Therapist schedule field is required');
    expect(
      updateTherapistScheduleSchema
        .safeParse({ therapistScheduleId: 1, rotaType: 'remove' })
        .error?.issues.map(({ message }) => message)
    ).toContain('Rota is required when rota type is provided');
  });

  it('should validate list parameters and date range', () => {
    expect(
      therapistScheduleListParamsSchema.parse({
        tenantId: 'tenant-1',
        therapistId: '4',
        page: '2',
        limit: '10',
      })
    ).toMatchObject({ tenantId: 'tenant-1', therapistId: 4, page: 2, limit: 10 });
    expect(
      therapistScheduleListParamsSchema
        .safeParse({ tenantId: 'tenant-1', fromDate: '2026-09-30', toDate: '2026-09-24' })
        .error?.issues.map(({ message }) => message)
    ).toContain('To date must be on or after from date');
  });
});
