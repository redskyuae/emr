import { describe, expect, it } from 'vitest';

import { EMPTY_BOOK_APPOINTMENT_FORM_VALUES } from './book-appointment-form-schema';
import { bookAppointmentFormValuesToRequest } from './book-appointment-request';

describe('Book Appointment request', () => {
  it('should map a Consultation for an existing Patient to the POST contract', () => {
    const request = bookAppointmentFormValuesToRequest({
      ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
      patientId: '12',
      patientMode: 'existing',
      visitType: 'CONSULTATION',
      doctorId: '18',
      appointmentModeId: '2',
      appointmentTypeId: '3',
      appointmentReasonId: '4',
      slotDate: '2099-12-31',
      doctorRotaId: '22',
      slotTimes: ['09:00', '09:15'],
      startTime: '09:00',
      endTime: '09:30',
      facilityId: '4',
      remarks: 'Follow-up requested',
    });

    expect(request).toEqual({
      doctorId: 18,
      appointmentModeId: 2,
      appointmentTypeId: 3,
      appointmentReasonId: 4,
      patientId: 12,
      slotDate: '31-12-2099',
      doctorRotaId: 22,
      slotTimes: ['09:00', '09:15'],
      remarks: 'Follow-up requested',
    });
  });

  it('should map a new Provisional Patient without UI-only booking fields', () => {
    const request = bookAppointmentFormValuesToRequest({
      ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
      patientMode: 'provisional',
      visitType: 'CONSULTATION',
      firstName: 'Asha',
      lastName: 'Rao',
      phone: '9876543210',
      email: 'asha@example.com',
      doctorId: '18',
      appointmentModeId: '2',
      appointmentTypeId: '3',
      appointmentReasonId: '4',
      slotDate: '2099-12-31',
      doctorRotaId: '22',
      slotTimes: ['09:00'],
      startTime: '09:00',
      endTime: '09:15',
      treatmentId: '400',
      sessionId: '400-1',
      roomId: '7',
      therapistId: '41',
    });

    expect(request).toEqual({
      doctorId: 18,
      appointmentModeId: 2,
      appointmentTypeId: 3,
      appointmentReasonId: 4,
      slotDate: '31-12-2099',
      doctorRotaId: 22,
      slotTimes: ['09:00'],
      remarks: undefined,
      provisionalPatient: {
        firstName: 'Asha',
        lastName: 'Rao',
        phone: '9876543210',
        email: 'asha@example.com',
        middleName: undefined,
        gender: undefined,
        dateOfBirth: undefined,
      },
    });
  });
});
