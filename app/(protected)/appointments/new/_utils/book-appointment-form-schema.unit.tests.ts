import { describe, expect, it } from 'vitest';
import {
  bookAppointmentFormSchema,
  EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
} from './book-appointment-form-schema';

const procedure = {
  ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
  patientId: '1001',
  visitType: 'PROCEDURE',
  treatmentId: '300',
  sessionId: '300-3',
  slotDate: '2026-09-10',
  startTime: '09:00',
  endTime: '10:15',
  roomId: '7',
  therapistId: '41',
};

describe('booking path validation', () => {
  it('should allow a Procedure without hidden Consultation fields', () => {
    expect(bookAppointmentFormSchema.safeParse(procedure).success).toBe(true);
  });

  it('should require a Doctor for a Consultation', () => {
    const result = bookAppointmentFormSchema.safeParse({
      ...procedure,
      visitType: 'CONSULTATION',
      doctorRotaId: '22',
      appointmentModeId: '1',
      appointmentTypeId: '1',
      appointmentReasonId: '3',
      slotTimes: ['09:00'],
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toEqual([
        expect.objectContaining({ path: ['doctorId'], message: 'Doctor is required' }),
      ]);
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
