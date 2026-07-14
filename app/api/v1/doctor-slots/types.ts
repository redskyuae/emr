import type { DoctorSlotDate } from '@/app/api/lib/modules/doctor-schedule/schemas/doctor-schedule-schema';

export type ListDoctorSlotsResponse = {
  data: DoctorSlotDate[];
};
