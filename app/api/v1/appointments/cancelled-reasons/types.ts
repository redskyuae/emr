import type { AppointmentCancelledReason } from '@/app/api/lib/modules/appointment-cancelled-reason/schemas/appointment-cancelled-reason-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAppointmentCancelledReasonsResponse = Paginated<AppointmentCancelledReason>;

export type SaveAppointmentCancelledReasonRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type SaveAppointmentCancelledReasonResponse = {
  data: AppointmentCancelledReason;
};
