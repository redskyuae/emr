import type { DoctorRota } from '@/app/api/lib/modules/doctor-rota/schemas/doctor-rota-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListDoctorRotasResponse = Paginated<DoctorRota>;

export type SaveDoctorRotaRequest = {
  name: string;
  toTime: string;
  fromTime: string;
};

export type SaveDoctorRotaResponse = {
  data: DoctorRota;
};
