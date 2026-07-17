import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';

export type LookupAppointmentResponse = {
  data: Appointment;
};
