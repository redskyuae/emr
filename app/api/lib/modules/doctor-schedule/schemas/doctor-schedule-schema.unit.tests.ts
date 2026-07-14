import { describe, expect, it } from 'vitest';

import {
  createDoctorScheduleSchema,
  doctorScheduleIdSchema,
  doctorSlotsParamsSchema,
  updateDoctorScheduleSchema,
} from './doctor-schedule-schema';

const errorsOf = (result: ReturnType<typeof createDoctorScheduleSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('DoctorSchedule schema', () => {
  it('should parse create payload and normalize HH:mm slot duration', () => {
    expect(
      createDoctorScheduleSchema.parse({
        doctorId: '7',
        rotaIds: ['1', '2'],
        slotInMinute: '00:15',
        slotFromDate: '2026-07-15',
        slotToDate: '2026-07-20',
      })
    ).toEqual({
      doctorId: 7,
      rotaIds: [1, 2],
      slotFromDate: '2026-07-15',
      slotToDate: '2026-07-20',
      slotDurationMinutes: 15,
    });
  });

  it('should accept legacy clinicianLicenseId alias for doctorId', () => {
    expect(
      createDoctorScheduleSchema.parse({
        clinicianLicenseId: 9,
        rotaIds: [1],
        slotInMinute: 30,
        slotFromDate: '2026-07-15',
        slotToDate: '2026-07-15',
      }).doctorId
    ).toBe(9);
  });

  it('should return validation errors for missing doctor, rotas, duration, and dates', () => {
    const result = createDoctorScheduleSchema.safeParse({});
    expect(errorsOf(result)).toEqual(
      expect.arrayContaining([
        'Doctor rota is required',
        'Slot duration is required',
        'Slot from date is required',
        'Slot to date is required',
      ])
    );
  });

  it('should require doctorId or the legacy clinicianLicenseId alias', () => {
    const result = createDoctorScheduleSchema.safeParse({
      rotaIds: [1],
      slotInMinute: '00:15',
      slotFromDate: '2026-07-15',
      slotToDate: '2026-07-15',
    });
    expect(errorsOf(result)).toContain('Doctor ID is required');
  });

  it('should reject invalid duration format', () => {
    expect(
      errorsOf(
        createDoctorScheduleSchema.safeParse({
          doctorId: 1,
          rotaIds: [1],
          slotInMinute: '15 minutes',
          slotFromDate: '2026-07-15',
          slotToDate: '2026-07-15',
        })
      )
    ).toContain('Slot duration must be in HH:mm format');
  });

  it('should reject invalid date ranges', () => {
    expect(
      errorsOf(
        createDoctorScheduleSchema.safeParse({
          doctorId: 1,
          rotaIds: [1],
          slotInMinute: '00:15',
          slotFromDate: '2026-07-20',
          slotToDate: '2026-07-15',
        })
      )
    ).toContain('Slot to date must be on or after slot from date');
  });

  it('should reject invalid date format', () => {
    const result = createDoctorScheduleSchema.safeParse({
      doctorId: 1,
      rotaIds: [1],
      slotInMinute: '00:15',
      slotFromDate: '2026/07/20',
      slotToDate: '2026-07-15',
    });
    expect(errorsOf(result)).toContain('Slot from date must be a valid date');
  });

  it('should require a mutable field on update in addition to schedule id', () => {
    const result = updateDoctorScheduleSchema.safeParse({ doctorScheduleId: 1 });
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'At least one Doctor schedule field is required'
    );
  });

  it('should parse update payload with legacy clinicianScheduleId alias', () => {
    expect(
      updateDoctorScheduleSchema.parse({
        clinicianScheduleId: '4',
        rotaIds: ['2'],
        rotaType: 'remove',
      })
    ).toEqual({
      id: 4,
      payload: {
        doctorId: undefined,
        rotaIds: [2],
        rotaType: 'remove',
        slotToDate: undefined,
        slotFromDate: undefined,
        slotDurationMinutes: undefined,
      },
    });
  });

  it('should validate schedule and slot identifiers', () => {
    expect(doctorScheduleIdSchema.safeParse('1').success).toBe(true);
    expect(doctorScheduleIdSchema.safeParse('0').success).toBe(false);
    expect(
      doctorSlotsParamsSchema.safeParse({
        tenantId: 'tenant-1',
        doctorId: '1',
        slotDate: '2026-07-15',
      }).success
    ).toBe(true);
  });
});
