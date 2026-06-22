import type { AppointmentReason } from '@/app/api/lib/modules/appointment-reason/schemas/appointment-reason-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAppointmentReasonsResponse = Paginated<AppointmentReason>;

export type SaveAppointmentReasonRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type SaveAppointmentReasonResponse = {
  data: AppointmentReason;
};
