import { describe, expect, it } from 'vitest';

import { createAppointmentSchema, listAppointmentsSchema } from './appointment-schema';

const validPayload = {
  doctorId: 1,
  appointmentModeId: 2,
  appointmentTypeId: 3,
  appointmentReasonId: 4,
  patientId: 5,
  slotDate: '31-12-2099',
  doctorRotaId: 6,
  slotTimes: ['09:00', '09:15'],
  remarks: 'Follow-up',
};

const errorsOf = (payload: unknown) =>
  createAppointmentSchema.safeParse(payload).error?.issues.map((issue) => issue.message) ?? [];

describe('Appointment schema', () => {
  it('should normalize DD-MM-YYYY slot date to ISO date and preserve HH:mm slot times', () => {
    expect(createAppointmentSchema.parse(validPayload)).toMatchObject({
      slotDate: '2099-12-31',
      slotTimes: ['09:00', '09:15'],
    });
  });

  it('should require exactly one of patientId or provisionalPatient', () => {
    expect(errorsOf({ ...validPayload, patientId: undefined })).toContain(
      'Exactly one of patientId or provisionalPatient is required'
    );
    expect(
      errorsOf({
        ...validPayload,
        provisionalPatient: { firstName: 'Asha', lastName: 'Rao', phone: '9876543210' },
      })
    ).toContain('Exactly one of patientId or provisionalPatient is required');
  });

  it('should accept provisional patient minimum details when patientId is absent', () => {
    expect(
      createAppointmentSchema.parse({
        ...validPayload,
        patientId: undefined,
        provisionalPatient: { firstName: ' Asha ', lastName: ' Rao ', phone: ' 9876543210 ' },
      })
    ).toMatchObject({
      provisionalPatient: { firstName: 'Asha', lastName: 'Rao', phone: '9876543210' },
    });
  });

  it('should reject non-DD-MM-YYYY slot date and non-HH:mm slot time', () => {
    expect(errorsOf({ ...validPayload, slotDate: '2099-12-31' })).toContain(
      'Slot date must be in DD-MM-YYYY format'
    );
    expect(errorsOf({ ...validPayload, slotTimes: ['9:00'] })).toContain(
      'Slot time must be in HH:mm format'
    );
  });

  it('should reject duplicate slot times and unknown fields', () => {
    expect(errorsOf({ ...validPayload, slotTimes: ['09:00', '09:00'] })).toContain(
      'Slot times must be unique'
    );
    expect(errorsOf({ ...validPayload, facilityId: 1 })).toContain(
      'Unrecognized key: "facilityId"'
    );
  });

  it('should trim empty remarks to undefined and cap long remarks', () => {
    expect(
      createAppointmentSchema.parse({ ...validPayload, remarks: '   ' }).remarks
    ).toBeUndefined();
    expect(errorsOf({ ...validPayload, remarks: 'a'.repeat(1001) })).toContain(
      'Remarks must be at most 1000 characters'
    );
  });

  describe('listAppointmentsSchema', () => {
    it('should normalize DD-MM-YYYY slot date filters to ISO dates', () => {
      expect(listAppointmentsSchema.parse({ slotDate: '16-07-2026' }).slotDate).toBe('2026-07-16');
    });

    it('should reject invalid date and id filters', () => {
      const result = listAppointmentsSchema.safeParse({ slotDate: '2026-07-16', doctorId: '0' });

      expect(result.error?.issues.map((issue) => issue.message)).toEqual([
        'Slot date must be in DD-MM-YYYY format',
        'Doctor ID must be positive',
      ]);
    });

    it('should trim query and coerce paging filters', () => {
      expect(listAppointmentsSchema.parse({ query: ' APT-1001 ', page: '2', limit: '5' })).toEqual({
        query: 'APT-1001',
        page: 2,
        limit: 5,
      });
    });

    it('should allow an empty filter set', () => {
      expect(listAppointmentsSchema.parse({})).toEqual({});
    });
  });
});
