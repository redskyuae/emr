import { describe, expect, it } from 'vitest';
import {
  bookAppointmentFormSchema,
  EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
} from './book-appointment-form-schema';

const procedure = {
  ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
  patientId: '1001',
  visitType: 'PROCEDURE',
  doctorId: '18',
  treatmentId: '300',
  sessionId: '300-3',
  slotDate: '2026-09-10',
  startTime: '09:00',
  endTime: '10:15',
  roomId: '7',
  therapistId: '41',
};

describe('booking path validation', () => {
  it('should allow a Procedure without Consultation-only fields', () => {
    expect(bookAppointmentFormSchema.safeParse(procedure).success).toBe(true);
  });

  it('should require a Doctor selection for a Procedure', () => {
    const result = bookAppointmentFormSchema.safeParse({ ...procedure, doctorId: '' });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['doctorId'], message: 'Doctor is required' })
      );
  });

  it('should allow the explicit N/A Doctor selection', () => {
    expect(
      bookAppointmentFormSchema.safeParse({ ...procedure, doctorId: 'not-applicable' }).success
    ).toBe(true);
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

  it('should require a Session for an existing Patient Procedure', () => {
    const result = bookAppointmentFormSchema.safeParse({ ...procedure, sessionId: '' });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toEqual([
        expect.objectContaining({ path: ['sessionId'], message: 'Session is required' }),
      ]);
  });

  it('should allow a Provisional Patient Treatment without a Session', () => {
    expect(
      bookAppointmentFormSchema.safeParse({
        ...procedure,
        sessionId: '',
        patientId: '',
        patientMode: 'provisional',
        firstName: 'Demo',
        lastName: 'Patient',
        phone: '5550100',
      }).success
    ).toBe(true);
  });
});
