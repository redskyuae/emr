import { describe, expect, it } from 'vitest';

import { EMPTY_BOOK_APPOINTMENT_FORM_VALUES } from '@/app/(protected)/appointments/new/_utils/book-appointment-form-schema';
import { rescheduleAppointmentFormValuesToRequest } from './reschedule-appointment-request';

describe('rescheduleAppointmentFormValuesToRequest', () => {
  it('should build a Consultation schedule-only request', () => {
    expect(
      rescheduleAppointmentFormValuesToRequest({
        ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
        visitType: 'CONSULTATION',
        rescheduleReason: 'Doctor requested a schedule change',
        doctorId: '7',
        slotDate: '2099-12-31',
        doctorRotaId: '8',
        slotTimes: ['10:00', '10:15'],
      })
    ).toEqual({
      bookingPath: 'CONSULTATION',
      rescheduleReason: 'Doctor requested a schedule change',
      doctorId: 7,
      slotDate: '31-12-2099',
      doctorRotaId: 8,
      slotTimes: ['10:00', '10:15'],
    });
  });

  it('should omit demo Procedure resources from the API request', () => {
    expect(
      rescheduleAppointmentFormValuesToRequest({
        ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
        visitType: 'PROCEDURE',
        rescheduleReason: 'Room maintenance is scheduled',
        slotDate: '2099-12-31',
        startTime: '11:00',
        endTime: '12:15',
        treatmentId: '400',
        sessionId: '400-1',
        roomId: '7',
        therapistId: '41',
      })
    ).toEqual({
      bookingPath: 'PROCEDURE',
      rescheduleReason: 'Room maintenance is scheduled',
      slotDate: '31-12-2099',
      startTime: '11:00',
      endTime: '12:15',
    });
  });
});
