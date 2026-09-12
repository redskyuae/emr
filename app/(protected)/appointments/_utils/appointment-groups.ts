import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';

type AppointmentDayViewItem = {
  appointmentStatus: Pick<Appointment['appointmentStatus'], 'category'>;
};

export function partitionAppointmentsByDayView<T extends AppointmentDayViewItem>(
  appointments: T[]
) {
  const upcoming: T[] = [];
  const completed: T[] = [];

  for (const appointment of appointments) {
    const { category } = appointment.appointmentStatus;

    if (category === 'completed') {
      completed.push(appointment);
    }

    if (category === 'scheduled' || category === 'confirmed' || category === 'checked_in') {
      upcoming.push(appointment);
    }
  }

  return { upcoming, completed };
}
