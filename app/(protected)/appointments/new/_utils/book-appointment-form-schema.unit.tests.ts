import { describe, expect, it } from 'vitest';
import {
  bookAppointmentFormSchema,
  EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
} from './book-appointment-form-schema';

const procedure = {
  ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
  patientId: '1001',
  visitType: 'PROCEDURE',
  doctorId: 'not-applicable',
  selectionMode: 'CATALOGUE',
  patientTreatmentPlanId: '',
  patientTreatmentPlanSessionId: '',
  treatmentId: '300',
  totalSessions: '8',
  slotDate: '2026-09-10',
  startTime: '09:00',
  endTime: '10:15',
  roomId: '7',
  therapistId: '41',
};

const errorsOf = (result: ReturnType<typeof bookAppointmentFormSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('booking path validation', () => {
  it('should allow a Procedure with Doctor N/A and no Rota or Appointment Details', () => {
    expect(bookAppointmentFormSchema.safeParse(procedure).success).toBe(true);
  });

  it('should allow an active Doctor selection for a Procedure', () => {
    expect(bookAppointmentFormSchema.safeParse({ ...procedure, doctorId: '18' }).success).toBe(
      true
    );
  });

  it('should still require Appointment classification and Doctor Rota for a Consultation', () => {
    const result = bookAppointmentFormSchema.safeParse({
      ...procedure,
      visitType: 'CONSULTATION',
      doctorId: '18',
    });

    expect(errorsOf(result)).toEqual(
      expect.arrayContaining([
        'Appointment Mode is required',
        'Appointment Type is required',
        'Appointment Reason is required',
        'Doctor Rota is required',
      ])
    );
  });

  it('should require a Doctor for a Consultation', () => {
    const result = bookAppointmentFormSchema.safeParse({
      ...procedure,
      visitType: 'CONSULTATION',
      doctorId: '',
      doctorRotaId: '22',
      appointmentModeId: '1',
      appointmentTypeId: '1',
      appointmentReasonId: '3',
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['doctorId'], message: 'Doctor is required' })
      );
  });

  it('should require start and end time for a Consultation', () => {
    const result = bookAppointmentFormSchema.safeParse({
      ...procedure,
      visitType: 'CONSULTATION',
      doctorId: '18',
      doctorRotaId: '22',
      appointmentModeId: '1',
      appointmentTypeId: '1',
      appointmentReasonId: '3',
      startTime: '',
      endTime: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['startTime'], message: 'Start time is required' })
      );
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['endTime'], message: 'End time is required' })
      );
    }
  });

  it('should require the end time to be later than the start time', () => {
    const result = bookAppointmentFormSchema.safeParse({
      ...procedure,
      startTime: '10:30',
      endTime: '10:00',
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['endTime'], message: 'End time must be after start time' })
      );
  });

  it('should reject the N/A Doctor selection for a Consultation', () => {
    const result = bookAppointmentFormSchema.safeParse({
      ...procedure,
      visitType: 'CONSULTATION',
      doctorId: 'not-applicable',
      doctorRotaId: '22',
      appointmentModeId: '1',
      appointmentTypeId: '1',
      appointmentReasonId: '3',
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['doctorId'],
          message: 'A Doctor is required for a Consultation',
        })
      );
  });

  it('should require a complete existing Plan and Plan Session selection', () => {
    const result = bookAppointmentFormSchema.safeParse({
      ...procedure,
      selectionMode: 'EXISTING_PLAN',
      treatmentId: '',
      totalSessions: '',
      patientTreatmentPlanId: '',
      patientTreatmentPlanSessionId: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['patientTreatmentPlanId'],
            message: 'Patient Treatment Plan is required',
          }),
          expect.objectContaining({
            path: ['patientTreatmentPlanSessionId'],
            message: 'Patient Treatment Plan Session is required',
          }),
        ])
      );
    }
  });

  it('should allow a complete existing Plan selection without a catalogue Treatment', () => {
    expect(
      bookAppointmentFormSchema.safeParse({
        ...procedure,
        selectionMode: 'EXISTING_PLAN',
        patientTreatmentPlanId: '91',
        patientTreatmentPlanSessionId: '912',
        treatmentId: '',
        totalSessions: '',
      }).success
    ).toBe(true);
  });

  it('should require a Treatment for catalogue assignment', () => {
    const result = bookAppointmentFormSchema.safeParse({ ...procedure, treatmentId: '' });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['treatmentId'], message: 'Treatment is required' })
      );
  });

  it('should require a selected Room rather than the previous not-required placeholder', () => {
    const result = bookAppointmentFormSchema.safeParse({ ...procedure, roomId: 'not-required' });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['roomId'], message: 'Room is required' })
      );
  });

  it('should allow catalogue assignment without a Repeatable count', () => {
    expect(bookAppointmentFormSchema.safeParse({ ...procedure, totalSessions: '' }).success).toBe(
      true
    );
  });

  it('should require a positive whole number when a Repeatable count is provided', () => {
    const result = bookAppointmentFormSchema.safeParse({ ...procedure, totalSessions: '2.5' });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['totalSessions'],
          message: 'Total Sessions must be a positive whole number',
        })
      );
  });

  it('should allow a Provisional Patient Procedure with a catalogue Treatment', () => {
    const result = bookAppointmentFormSchema.safeParse({
      ...procedure,
      patientId: '',
      patientMode: 'provisional',
      firstName: 'Demo',
      lastName: 'Patient',
      phone: '0501234567',
    });

    expect(result.success).toBe(true);
  });
});

describe('Provisional Patient phone validation', () => {
  const provisionalConsultation = {
    ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
    patientMode: 'provisional',
    firstName: 'Demo',
    lastName: 'Patient',
    visitType: 'CONSULTATION',
    doctorId: '18',
    doctorRotaId: '22',
    appointmentModeId: '1',
    appointmentTypeId: '1',
    appointmentReasonId: '3',
    slotDate: '2026-09-10',
    startTime: '09:00',
    endTime: '09:30',
  };
  const invalidPhoneMessage = 'Enter a valid UAE mobile number, e.g. 0501234567 or +971501234567';
  const parsePhone = (phone: string) =>
    bookAppointmentFormSchema.safeParse({ ...provisionalConsultation, phone });

  it.each([
    '0501234567',
    '0521234567',
    '0531234567',
    '0541234567',
    '0551234567',
    '0561234567',
    '0581234567',
  ])('should accept the local UAE mobile number %s', (phone) => {
    expect(parsePhone(phone).success).toBe(true);
  });

  it.each(['+971501234567', '+971521234567', '+971531234567'])(
    'should accept the UAE mobile number %s with the country code',
    (phone) => {
      expect(parsePhone(phone).success).toBe(true);
    }
  );

  it.each([
    ['050 123 4567', '0501234567'],
    [' +971 50 123 4567 ', '+971501234567'],
  ])('should accept %s and strip its display spacing', (phone, expected) => {
    const result = parsePhone(phone);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe(expected);
  });

  it.each([
    ['a missing leading 0', '501234567'],
    ['a number that is too short', '050123456'],
    ['a number that is too long', '05012345678'],
    ['an invalid UAE mobile prefix', '0601234567'],
    ['a number without a UAE mobile prefix', '1234567890'],
    ['a leading 0 after the country code', '+9710501234567'],
    ['a country code without the plus sign', '971501234567'],
    ['non-digit characters', '05012345ab'],
  ])('should reject %s', (_reason, phone) => {
    const result = parsePhone(phone);

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['phone'], message: invalidPhoneMessage })
      );
  });

  it.each(['', '   '])('should require a phone number when the value is "%s"', (phone) => {
    const result = parsePhone(phone);

    expect(errorsOf(result)).toContain('Patient phone is required');
    expect(errorsOf(result)).not.toContain(invalidPhoneMessage);
  });

  it('should not validate the phone number for an existing Patient', () => {
    const result = bookAppointmentFormSchema.safeParse({
      ...provisionalConsultation,
      patientMode: 'existing',
      patientId: '1001',
      phone: '12345',
    });

    expect(result.success).toBe(true);
  });
});
