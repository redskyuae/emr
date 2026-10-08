import { describe, expect, it } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { buildAppointmentExportRows } from './appointment-export';

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 10,
    cancelledAt: null,
    remarks: null,
    rescheduleReason: null,
    rotaName: 'Morning',
    doctorRotaId: 6,
    roomId: null,
    tenantId: 'tenant-1',
    slotDate: '08-10-2026',
    startTime: null,
    endTime: null,
    bookingPath: 'CONSULTATION',
    bookingNumber: 'APT-1001',
    createdOn: new Date('2026-10-08T03:30:00.000Z'),
    doctor: { id: 1, name: 'Dr. Meera' },
    therapist: null,
    patient: {
      id: 5,
      mrn: 'MRN-1001',
      phone: '9876543210',
      lastName: 'Rao',
      firstName: 'Asha',
      registrationStatus: 'registered',
    },
    appointmentMode: { id: 2, name: 'In-person', code: 'INP' },
    appointmentType: { id: 3, name: 'Consultation', code: 'CONS' },
    appointmentReason: { id: 4, name: 'Follow-up', code: 'FUP' },
    appointmentCancelledReason: null,
    appointmentStatus: { id: 7, name: 'Scheduled', code: 'SCH', category: 'scheduled' },
    treatment: null,
    treatmentSession: null,
    slots: [
      { slotTime: '09:00', status: 'Booked' },
      { slotTime: '09:15', status: 'Booked' },
    ],
    ...overrides,
  };
}

describe('Appointment export rows', () => {
  it('should map a Consultation Appointment into spreadsheet and PDF columns', () => {
    expect(buildAppointmentExportRows([appointment()])).toEqual([
      {
        Booking: 'APT-1001',
        Date: '08-10-2026',
        Time: '09:00-09:15',
        Patient: 'Asha Rao',
        MRN: 'MRN-1001',
        Phone: '9876543210',
        Doctor: 'Dr. Meera',
        Therapist: 'N/A',
        Type: 'Consultation',
        Mode: 'In-person',
        Treatment: 'N/A',
        Status: 'Scheduled',
      },
    ]);
  });

  it('should map Procedure timing, Therapist, and Treatment details', () => {
    const procedure = appointment({
      bookingPath: 'PROCEDURE',
      startTime: '10:00',
      endTime: '11:15',
      doctor: null,
      therapist: { id: 8, name: 'Leela Krishnan' },
      appointmentMode: null,
      appointmentType: null,
      treatment: { id: 21, name: 'Abhyanga', code: 'ABH' },
      slots: [],
    });

    expect(buildAppointmentExportRows([procedure])[0]).toMatchObject({
      Time: '10:00-11:15',
      Doctor: 'N/A',
      Therapist: 'Leela Krishnan',
      Type: 'PROCEDURE',
      Mode: 'N/A',
      Treatment: 'Abhyanga',
    });
  });
});
