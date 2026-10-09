import { describe, expect, it } from 'vitest';

import {
  filterAppointmentsForDayView,
  partitionAppointmentsByDayView,
} from './appointment-day-view';

describe('Appointment day view', () => {
  it('should place active lifecycle Appointments in upcoming and completed Appointments in completed', () => {
    const scheduled = { appointmentStatus: { category: 'scheduled' as const } };
    const confirmed = { appointmentStatus: { category: 'confirmed' as const } };
    const checkedIn = { appointmentStatus: { category: 'checked_in' as const } };
    const completed = { appointmentStatus: { category: 'completed' as const } };

    expect(partitionAppointmentsByDayView([scheduled, confirmed, checkedIn, completed])).toEqual({
      upcoming: [scheduled, confirmed, checkedIn],
      completed: [completed],
    });
  });

  it('should omit cancelled and no-show Appointments from the operational day view', () => {
    const scheduled = { appointmentStatus: { category: 'scheduled' as const } };
    const completed = { appointmentStatus: { category: 'completed' as const } };
    const cancelled = { appointmentStatus: { category: 'cancelled' as const } };
    const noShow = { appointmentStatus: { category: 'no_show' as const } };

    expect(filterAppointmentsForDayView([scheduled, cancelled, noShow, completed])).toEqual([
      scheduled,
      completed,
    ]);
    expect(partitionAppointmentsByDayView([cancelled, noShow])).toEqual({
      upcoming: [],
      completed: [],
    });
  });
});
