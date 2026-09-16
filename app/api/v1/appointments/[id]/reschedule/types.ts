import type {
  Appointment,
  RescheduleAppointmentInput,
} from '@/app/api/lib/modules/appointment/schemas/appointment-schema';

export type RescheduleAppointmentRequest = RescheduleAppointmentInput;

export type RescheduleAppointmentResponse = {
  data: Appointment;
};
