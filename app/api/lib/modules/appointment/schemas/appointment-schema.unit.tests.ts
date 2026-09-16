import { describe, expect, it } from 'vitest';

import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  listAppointmentsSchema,
  rescheduleAppointmentSchema,
} from './appointment-schema';

const validPayload = {
  bookingPath: 'CONSULTATION',
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

const validProcedurePayload = {
  bookingPath: 'PROCEDURE',
  patientId: 5,
  slotDate: '31-12-2099',
  startTime: '10:00',
  endTime: '11:15',
  treatmentId: 400,
  treatmentSessionId: 401,
};

const errorsOf = (payload: unknown) =>
  createAppointmentSchema.safeParse(payload).error?.issues.map((issue) => issue.message) ?? [];

describe('Appointment schema', () => {
  it('should require and normalize an Appointment Cancelled Reason ID', () => {
    expect(cancelAppointmentSchema.parse({ appointmentCancelledReasonId: '7' })).toEqual({
      appointmentCancelledReasonId: 7,
    });
    expect(
      cancelAppointmentSchema.safeParse({ appointmentCancelledReasonId: 0 }).error?.issues[0]
        ?.message
    ).toBe('Appointment cancelled reason ID must be positive');
    expect(cancelAppointmentSchema.safeParse({}).success).toBe(false);
    expect(
      cancelAppointmentSchema.safeParse({ appointmentCancelledReasonId: 7, note: 'extra' }).success
    ).toBe(false);
  });

  it('should normalize a Consultation reschedule request', () => {
    expect(
      rescheduleAppointmentSchema.parse({
        bookingPath: 'CONSULTATION',
        doctorId: 7,
        slotDate: '31-12-2099',
        doctorRotaId: 8,
        slotTimes: ['10:00', '10:15'],
      })
    ).toEqual({
      bookingPath: 'CONSULTATION',
      doctorId: 7,
      slotDate: '2099-12-31',
      doctorRotaId: 8,
      slotTimes: ['10:00', '10:15'],
    });
  });

  it('should normalize a Procedure reschedule request without accepting a Doctor', () => {
    expect(
      rescheduleAppointmentSchema.parse({
        bookingPath: 'PROCEDURE',
        slotDate: '31-12-2099',
        startTime: '11:00',
        endTime: '12:15',
      })
    ).toEqual({
      bookingPath: 'PROCEDURE',
      slotDate: '2099-12-31',
      startTime: '11:00',
      endTime: '12:15',
    });

    expect(
      rescheduleAppointmentSchema.safeParse({
        bookingPath: 'PROCEDURE',
        doctorId: 7,
        slotDate: '31-12-2099',
        startTime: '11:00',
        endTime: '12:15',
      }).success
    ).toBe(false);
  });

  it('should reject invalid Procedure reschedule windows and duplicate Consultation slots', () => {
    expect(
      rescheduleAppointmentSchema
        .safeParse({
          bookingPath: 'PROCEDURE',
          slotDate: '31-12-2099',
          startTime: '12:00',
          endTime: '11:00',
        })
        .error?.issues.map((issue) => issue.message)
    ).toContain('End time must be after start time');
    expect(
      rescheduleAppointmentSchema
        .safeParse({
          bookingPath: 'CONSULTATION',
          doctorId: 7,
          slotDate: '31-12-2099',
          doctorRotaId: 8,
          slotTimes: ['10:00', '10:00'],
        })
        .error?.issues.map((issue) => issue.message)
    ).toContain('Slot times must be unique');
  });

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

  it('should require a Treatment and Session on a Procedure', () => {
    const withoutTreatment = {
      bookingPath: validProcedurePayload.bookingPath,
      patientId: validProcedurePayload.patientId,
      slotDate: validProcedurePayload.slotDate,
      startTime: validProcedurePayload.startTime,
      endTime: validProcedurePayload.endTime,
    };

    expect(errorsOf(withoutTreatment)).toEqual(
      expect.arrayContaining(['Treatment ID is required', 'Treatment session ID is required'])
    );
  });

  it('should accept a Procedure without a Doctor, Doctor Rota, or Appointment Details', () => {
    expect(createAppointmentSchema.parse(validProcedurePayload)).toEqual({
      ...validProcedurePayload,
      slotDate: '2099-12-31',
    });
  });

  it('should accept an optional Doctor assignment for a Procedure', () => {
    expect(createAppointmentSchema.parse({ ...validProcedurePayload, doctorId: 7 })).toMatchObject({
      bookingPath: 'PROCEDURE',
      doctorId: 7,
    });
  });

  it('should reject invalid Procedure time windows', () => {
    expect(errorsOf({ ...validProcedurePayload, startTime: '10' })).toContain(
      'Start time must be in HH:mm format'
    );
    expect(errorsOf({ ...validProcedurePayload, endTime: '10:00' })).toContain(
      'End time must be after start time'
    );
  });

  it('should reject Consultation-only fields on a Procedure', () => {
    expect(errorsOf({ ...validProcedurePayload, doctorRotaId: 6 })).toContain(
      'Unrecognized key: "doctorRotaId"'
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
