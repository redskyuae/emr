import type { DoctorSchedule } from '@/app/api/lib/modules/doctor-schedule/schemas/doctor-schedule-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListDoctorSchedulesResponse = Paginated<DoctorSchedule>;

export type SaveDoctorScheduleRequest = {
  doctorId?: number;
  facilityId?: number;
  clinicianLicenseId?: number;
  rotaIds: number[];
  slotInMinute: string | number;
  slotToDate: string;
  slotFromDate: string;
  rotaType?: 'new' | 'remove';
};

export type UpdateDoctorScheduleRequest = Partial<SaveDoctorScheduleRequest> & {
  doctorScheduleId?: number;
  clinicianScheduleId?: number;
};

export type SaveDoctorScheduleResponse = {
  data: DoctorSchedule;
};
