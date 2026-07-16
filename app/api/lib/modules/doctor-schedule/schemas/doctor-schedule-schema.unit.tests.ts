import { describe, expect, it } from 'vitest';

import {
  createDoctorScheduleSchema,
  doctorScheduleIdSchema,
  doctorScheduleListParamsSchema,
  doctorSlotsParamsSchema,
  updateDoctorScheduleSchema,
} from './doctor-schedule-schema';

const errorsOf = (
  result: { success: true } | { success: false; error: { issues: { message: string }[] } }
) => (result.success ? [] : result.error.issues.map((issue) => issue.message));

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

  it('should reject duplicate rota ids on create and update', () => {
    expect(
      errorsOf(
        createDoctorScheduleSchema.safeParse({
          doctorId: 1,
          rotaIds: [1, 1, 2],
          slotInMinute: '00:15',
          slotFromDate: '2026-07-15',
          slotToDate: '2026-07-15',
        })
      )
    ).toContain('Doctor rota IDs must be unique');

    expect(
      updateDoctorScheduleSchema
        .safeParse({ doctorScheduleId: 1, rotaIds: [1, 1, 2], rotaType: 'new' })
        .error?.issues.map((issue) => issue.message)
    ).toContain('Doctor rota IDs must be unique');
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

  it('should validate the slot duration upper boundary', () => {
    expect(
      createDoctorScheduleSchema.parse({
        doctorId: 1,
        rotaIds: [1],
        slotInMinute: 1440,
        slotFromDate: '2026-07-15',
        slotToDate: '2026-07-15',
      }).slotDurationMinutes
    ).toBe(1440);

    expect(
      errorsOf(
        createDoctorScheduleSchema.safeParse({
          doctorId: 1,
          rotaIds: [1],
          slotInMinute: 1441,
          slotFromDate: '2026-07-15',
          slotToDate: '2026-07-15',
        })
      )
    ).toContain('Slot duration must be at most 1440 minutes');
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

  it('should require rota ids when rota type is provided on update', () => {
    const result = updateDoctorScheduleSchema.safeParse({
      clinicianScheduleId: 1,
      rotaType: 'remove',
    });
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'Doctor rota is required when rota type is provided'
    );
  });

  it('should reject facility id because Facility is not part of the DoctorSchedule contract', () => {
    expect(
      createDoctorScheduleSchema.safeParse({
        doctorId: 1,
        facilityId: 10,
        rotaIds: [1],
        slotInMinute: '00:15',
        slotFromDate: '2026-07-15',
        slotToDate: '2026-07-15',
      }).success
    ).toBe(false);
    expect(
      updateDoctorScheduleSchema.safeParse({
        doctorScheduleId: 1,
        facilityId: 10,
        slotFromDate: '2026-07-15',
      }).success
    ).toBe(false);
  });

  it('should reject rota type on create because rota type only applies to updates', () => {
    expect(
      createDoctorScheduleSchema.safeParse({
        doctorId: 1,
        rotaIds: [1],
        rotaType: 'remove',
        slotInMinute: '00:15',
        slotFromDate: '2026-07-15',
        slotToDate: '2026-07-15',
      }).success
    ).toBe(false);
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

  it('should validate doctor schedule list params', () => {
    expect(
      doctorScheduleListParamsSchema.safeParse({
        tenantId: 'tenant-1',
        doctorId: '1',
        fromDate: '2026-07-15',
        toDate: '2026-07-20',
        limit: '999',
      }).success
    ).toBe(true);

    expect(
      errorsOf(doctorScheduleListParamsSchema.safeParse({ tenantId: 'tenant-1', limit: 1000 }))
    ).toContain('Limit must be at most 999');

    expect(errorsOf(doctorScheduleListParamsSchema.safeParse({}))).toContain(
      'Tenant ID is required'
    );

    expect(
      errorsOf(
        doctorScheduleListParamsSchema.safeParse({
          tenantId: ' ',
          doctorId: 'abc',
          fromDate: '2026/07/15',
          toDate: '2026-07-20',
        })
      )
    ).toEqual(
      expect.arrayContaining([
        'Tenant ID cannot be empty',
        'Doctor ID is required',
        'From date must be a valid date',
      ])
    );

    expect(
      errorsOf(
        doctorScheduleListParamsSchema.safeParse({
          tenantId: 'tenant-1',
          fromDate: '2026-07-20',
          toDate: '2026-07-15',
        })
      )
    ).toContain('To date must be on or after from date');
  });

  it('should validate doctor slots params', () => {
    expect(errorsOf(doctorSlotsParamsSchema.safeParse({}))).toEqual(
      expect.arrayContaining([
        'Tenant ID is required',
        'Doctor ID is required',
        'Slot date is required',
      ])
    );

    expect(
      errorsOf(
        doctorSlotsParamsSchema.safeParse({
          tenantId: ' ',
          doctorId: 'abc',
          slotDate: '2026/07/15',
        })
      )
    ).toEqual(
      expect.arrayContaining([
        'Tenant ID cannot be empty',
        'Doctor ID is required',
        'Slot date must be a valid date in DD-MM-YYYY or YYYY-MM-DD format',
      ])
    );
  });
});
