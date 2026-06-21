import type { AppointmentType } from '@/app/api/lib/modules/appointment-type/schemas/appointment-type-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAppointmentTypesResponse = Paginated<AppointmentType>;

export type SaveAppointmentTypeRequest = {
  name: string;
  code: string;
  description?: string | null;
};

export type SaveAppointmentTypeResponse = {
  data: AppointmentType;
};
