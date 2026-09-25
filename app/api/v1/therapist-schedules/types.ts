import type { TherapistSchedule } from '@/app/api/lib/modules/therapist-schedule/schemas/therapist-schedule-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListTherapistSchedulesResponse = Paginated<TherapistSchedule>;
export type SaveTherapistScheduleRequest = {
  rotaIds: number[];
  therapistId: number;
  slotInMinute: string | number;
  slotToDate: string;
  slotFromDate: string;
};
export type UpdateTherapistScheduleRequest = Partial<SaveTherapistScheduleRequest> & {
  rotaType?: 'new' | 'remove';
  therapistScheduleId: number;
};
export type SaveTherapistScheduleResponse = { data: TherapistSchedule };
