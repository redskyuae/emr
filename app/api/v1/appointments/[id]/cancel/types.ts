import type {
  Appointment,
  CancelAppointmentInput,
} from '@/app/api/lib/modules/appointment/schemas/appointment-schema';

export type CancelAppointmentRequest = CancelAppointmentInput;
export type CancelAppointmentResponse = { data: Appointment };
