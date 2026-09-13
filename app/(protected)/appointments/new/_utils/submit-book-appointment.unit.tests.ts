import { describe, expect, it } from 'vitest';

import type { CreateAppointmentRequest } from '@/app/api/v1/appointments/types';
import { EMPTY_BOOK_APPOINTMENT_FORM_VALUES } from './book-appointment-form-schema';
import { submitBookAppointment } from './submit-book-appointment';

describe('submit Book Appointment', () => {
  it('should create a Procedure Appointment without sending temporary dependency IDs', async () => {
    let submittedRequest: CreateAppointmentRequest | undefined;

    const confirmation = await submitBookAppointment(
      {
        ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
        patientId: '12',
        patientMode: 'existing',
        visitType: 'PROCEDURE',
        doctorId: 'not-applicable',
        slotDate: '2099-12-31',
        startTime: '09:00',
        endTime: '09:30',
        treatmentId: '400',
        sessionId: '400-1',
        roomId: '7',
        therapistId: '41',
      },
      async (request) => {
        submittedRequest = request;

        return {
          data: {
            id: 81,
            tenantId: 'tenant-1',
            bookingNumber: 'APT-1081',
            slotDate: '31-12-2099',
            startTime: '09:00',
            endTime: '09:30',
            bookingPath: 'PROCEDURE',
            rotaName: null,
            remarks: null,
            createdOn: new Date('2099-01-01T00:00:00.000Z'),
            doctor: null,
            patient: {
              id: 12,
              mrn: 'MRN-0012',
              firstName: 'Asha',
              lastName: 'Rao',
              phone: '9876543210',
              registrationStatus: 'registered',
            },
            appointmentMode: null,
            appointmentType: null,
            appointmentReason: null,
            appointmentStatus: {
              id: 5,
              name: 'Scheduled',
              code: 'SCH',
              category: 'scheduled',
            },
            slots: [],
          },
        };
      }
    );

    expect(submittedRequest).toEqual({
      bookingPath: 'PROCEDURE',
      patientId: 12,
      slotDate: '31-12-2099',
      startTime: '09:00',
      endTime: '09:30',
      remarks: undefined,
    });
    expect(confirmation).toEqual({
      bookingNumber: 'APT-1081',
      path: 'PROCEDURE',
      patientName: 'Asha Rao',
      detail: 'N/A · 31-12-2099 · 09:00–09:30',
    });
  });
});
