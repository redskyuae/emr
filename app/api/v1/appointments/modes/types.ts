import type { AppointmentMode } from '@/app/api/lib/modules/appointment-mode/schemas/appointment-mode-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAppointmentModesResponse = Paginated<AppointmentMode>;

export type SaveAppointmentModeRequest = {
  name: string;
  code: string;
  description?: string;
};

export type SaveAppointmentModeResponse = {
  data: AppointmentMode;
};
