import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListPatientVitalSignsResponse = Paginated<PatientVitalSign>;

export type SavePatientVitalSignRequest = {
  visitId?: number;
  recordedAt?: string;
  heightCm?: number;
  weightKg?: number;
  systolic?: number;
  diastolic?: number;
  pulseBpm?: number;
  respRate?: number;
  temperatureC?: number;
  spo2?: number;
  painScore?: number;
  notes?: string;
};

export type SavePatientVitalSignResponse = {
  data: PatientVitalSign;
};
