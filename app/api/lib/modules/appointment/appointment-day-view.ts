import type { Appointment } from './schemas/appointment-schema';

type AppointmentDayViewItem = {
  appointmentStatus: Pick<Appointment['appointmentStatus'], 'category'>;
};

export function isAppointmentInDayView(appointment: AppointmentDayViewItem) {
  const { category } = appointment.appointmentStatus;
  return (
    category === 'scheduled' ||
    category === 'confirmed' ||
    category === 'checked_in' ||
    category === 'completed'
  );
}

export function filterAppointmentsForDayView<T extends AppointmentDayViewItem>(appointments: T[]) {
  return appointments.filter(isAppointmentInDayView);
}

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
