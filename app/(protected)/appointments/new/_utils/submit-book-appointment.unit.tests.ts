import { describe, expect, it } from 'vitest';

import type { CreateAppointmentRequest } from '@/app/api/v1/appointments/types';
import { EMPTY_BOOK_APPOINTMENT_FORM_VALUES } from './book-appointment-form-schema';
import { submitBookAppointment, submitBookAppointmentAndNavigate } from './submit-book-appointment';

describe('submit Book Appointment', () => {
  it('should notify and navigate to Appointments only after a successful booking', async () => {
    const events: string[] = [];

    await submitBookAppointmentAndNavigate(
      {
        ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
        patientId: '82',
        patientMode: 'existing',
        visitType: 'PROCEDURE',
        doctorId: 'not-applicable',
        selectionMode: 'CATALOGUE',
        slotDate: '2099-12-31',
        startTime: '09:00',
        endTime: '09:30',
        treatmentId: '400',
        roomId: '7',
        therapistId: '41',
      },
      async () => {
        events.push('created');
        return {
          data: {
            id: 82,
            tenantId: 'tenant-1',
            bookingNumber: 'APT-1082',
            slotDate: '31-12-2099',
            startTime: '09:00',
            endTime: '09:30',
            bookingPath: 'PROCEDURE',
            rotaName: null,
            doctorRotaId: null,
            cancelledAt: null,
            appointmentCancelledReason: null,
            remarks: null,
            createdOn: new Date('2099-01-01T00:00:00.000Z'),
            doctor: null,
            patient: {
              id: 82,
              mrn: 'MRN-0082',
              firstName: 'Asha',
              lastName: 'Rao',
              phone: '9876543210',
              registrationStatus: 'provisional',
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
            treatment: null,
            treatmentSession: null,
          },
        };
      },
      () => events.push('notified'),
      (href) => events.push(href)
    );

    expect(events).toEqual(['created', 'notified', '/appointments']);
  });

  it('should create a Procedure Appointment with its selected resources', async () => {
    let submittedRequest: CreateAppointmentRequest | undefined;

    const confirmation = await submitBookAppointment(
      {
        ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
        patientId: '12',
        patientMode: 'existing',
        visitType: 'PROCEDURE',
        doctorId: 'not-applicable',
        selectionMode: 'CATALOGUE',
        slotDate: '2099-12-31',
        startTime: '09:00',
        endTime: '09:30',
        treatmentId: '400',
        sessionId: '4001',
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
            doctorRotaId: null,
            cancelledAt: null,
            appointmentCancelledReason: null,
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
            treatment: null,
            treatmentSession: null,
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
      roomId: 7,
      therapistId: 41,
      treatmentId: 400,
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
