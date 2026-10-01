import { describe, expect, it } from 'vitest';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { ListAppointmentsResponse } from '@/app/api/v1/appointments/types';

import { summarizeAppointmentDay } from './useAppointments';

function appointment(
  id: number,
  category: Appointment['appointmentStatus']['category'],
  bookingPath: Appointment['bookingPath'] = 'CONSULTATION'
): Appointment {
  return {
    id,
    cancelledAt: null,
    remarks: null,
    rescheduleReason: null,
    rotaName: 'Morning',
    doctorRotaId: 1,
    tenantId: 'tenant-1',
    slotDate: '01-10-2026',
    startTime: '09:00',
    endTime: '09:15',
    bookingPath,
    bookingNumber: `APT-${id}`,
    createdOn: new Date('2026-10-01T08:00:00.000Z'),
    doctor: { id: 1, name: 'Dr. Kumar' },
    patient: {
      id: 1,
      mrn: 'MRN-1',
      phone: '1234567890',
      lastName: 'Rao',
      firstName: 'Anita',
      registrationStatus: 'registered',
    },
    appointmentMode: null,
    appointmentType: null,
    appointmentReason: null,
    appointmentCancelledReason: null,
    appointmentStatus: { id, name: category, code: category, category },
    treatment: null,
    treatmentSession: null,
    slots: [{ status: 'Booked', slotTime: '09:00' }],
  };
}

describe('Appointment dashboard summary', () => {
  it('counts every status while keeping only active Appointments in the schedule', () => {
    const data = [
      appointment(1, 'scheduled'),
      appointment(2, 'confirmed', 'PROCEDURE'),
      appointment(3, 'checked_in'),
      appointment(4, 'completed'),
      appointment(5, 'cancelled'),
      appointment(6, 'no_show'),
    ];
    const response: ListAppointmentsResponse = {
      data,
      meta: { total: 7, pageNumber: 1, pageSize: 999, totalPages: 1 },
    };

    const summary = summarizeAppointmentDay(response);

    expect(summary.total).toBe(7);
    expect(summary.counts).toEqual({
      scheduled: 1,
      confirmed: 1,
      checkedIn: 1,
      completed: 1,
      cancelled: 1,
      noShow: 1,
    });
    expect(summary.bookingPaths).toEqual({ consultation: 5, procedure: 1 });
    expect(summary.activeAppointments.map(({ id }) => id)).toEqual([1, 2, 3]);
    expect(summary.hasMore).toBe(true);
  });
});
