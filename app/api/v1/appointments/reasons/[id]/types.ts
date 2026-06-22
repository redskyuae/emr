import type { AppointmentReason } from '@/app/api/lib/modules/appointment-reason/schemas/appointment-reason-schema';

export type GetAppointmentReasonResponse = {
  data: AppointmentReason;
};

export type UpdateAppointmentReasonRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type UpdateAppointmentReasonResponse = {
  data: AppointmentReason;
};

export type DeleteAppointmentReasonResponse = void;
