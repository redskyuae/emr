import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';

type AppointmentStatusCategory = Appointment['appointmentStatus']['category'];

export function canCancelAppointment(category: AppointmentStatusCategory) {
  return category === 'scheduled' || category === 'confirmed';
}
