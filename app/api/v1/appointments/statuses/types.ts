import type { AppointmentStatus } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAppointmentStatusesResponse = Paginated<AppointmentStatus>;

export type SaveAppointmentStatusRequest = {
  name: string;
  code: string;
  category: string;
  description?: string;
};

export type SaveAppointmentStatusResponse = {
  data: AppointmentStatus;
};
