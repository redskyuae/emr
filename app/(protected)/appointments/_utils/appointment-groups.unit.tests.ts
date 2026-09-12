import { describe, expect, it } from 'vitest';

import { partitionAppointmentsByDayView } from './appointment-groups';

describe('partitionAppointmentsByDayView', () => {
  it('should place active lifecycle appointments in the upcoming group and completed appointments in the completed group', () => {
    const scheduled = { appointmentStatus: { category: 'scheduled' as const } };
    const confirmed = { appointmentStatus: { category: 'confirmed' as const } };
    const checkedIn = { appointmentStatus: { category: 'checked_in' as const } };
    const completed = { appointmentStatus: { category: 'completed' as const } };

    expect(partitionAppointmentsByDayView([scheduled, confirmed, checkedIn, completed])).toEqual({
      upcoming: [scheduled, confirmed, checkedIn],
      completed: [completed],
    });
  });

  it('should omit cancelled and no-show appointments from the operational day view', () => {
    const cancelled = { appointmentStatus: { category: 'cancelled' as const } };
    const noShow = { appointmentStatus: { category: 'no_show' as const } };

    expect(partitionAppointmentsByDayView([cancelled, noShow])).toEqual({
      upcoming: [],
      completed: [],
    });
  });
});
