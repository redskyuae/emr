import type { DoctorSchedule } from '@/app/api/lib/modules/doctor-schedule/schemas/doctor-schedule-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListDoctorSchedulesResponse = Paginated<DoctorSchedule>;

export type SaveDoctorScheduleRequest = {
  doctorId?: number;
  clinicianLicenseId?: number;
  rotaIds: number[];
  slotInMinute: string | number;
  slotToDate: string;
  slotFromDate: string;
};

export type UpdateDoctorScheduleRequest = Partial<SaveDoctorScheduleRequest> & {
  rotaType?: 'new' | 'remove';
  doctorScheduleId?: number;
  clinicianScheduleId?: number;
};

export type SaveDoctorScheduleResponse = {
  data: DoctorSchedule;
};
