import type { DoctorRota } from '@/app/api/lib/modules/doctor-rota/schemas/doctor-rota-schema';

export type GetDoctorRotaResponse = {
  data: DoctorRota;
};

export type UpdateDoctorRotaRequest = {
  name: string;
  toTime: string;
  fromTime: string;
};

export type UpdateDoctorRotaResponse = {
  data: DoctorRota;
};

export type DeleteDoctorRotaResponse = void;
