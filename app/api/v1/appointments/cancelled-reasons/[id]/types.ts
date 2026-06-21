import type { AppointmentCancelledReason } from '@/app/api/lib/modules/appointment-cancelled-reason/schemas/appointment-cancelled-reason-schema';

export type GetAppointmentCancelledReasonResponse = {
  data: AppointmentCancelledReason;
};

export type UpdateAppointmentCancelledReasonRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type UpdateAppointmentCancelledReasonResponse = {
  data: AppointmentCancelledReason;
};

export type DeleteAppointmentCancelledReasonResponse = void;
