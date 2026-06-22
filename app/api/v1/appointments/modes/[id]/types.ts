import type { AppointmentMode } from '@/app/api/lib/modules/appointment-mode/schemas/appointment-mode-schema';

export type GetAppointmentModeResponse = {
  data: AppointmentMode;
};

export type UpdateAppointmentModeRequest = {
  name: string;
  code: string;
  description?: string;
};

export type UpdateAppointmentModeResponse = {
  data: AppointmentMode;
};

export type DeleteAppointmentModeResponse = void;
