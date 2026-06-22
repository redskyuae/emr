import type { AppointmentStatus } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';

export type GetAppointmentStatusResponse = {
  data: AppointmentStatus;
};

export type UpdateAppointmentStatusRequest = {
  name: string;
  code: string;
  description?: string;
};

export type UpdateAppointmentStatusResponse = {
  data: AppointmentStatus;
};

export type DeleteAppointmentStatusResponse = void;
