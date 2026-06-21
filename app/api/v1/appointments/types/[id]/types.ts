import type { AppointmentType } from '@/app/api/lib/modules/appointment-type/schemas/appointment-type-schema';

export type GetAppointmentTypeResponse = {
  data: AppointmentType;
};

export type UpdateAppointmentTypeRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type UpdateAppointmentTypeResponse = {
  data: AppointmentType;
};

export type DeleteAppointmentTypeResponse = void;
