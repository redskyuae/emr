import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';

export type GetPatientVitalSignResponse = {
  data: PatientVitalSign;
};

export type UpdatePatientVitalSignRequest = {
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

export type UpdatePatientVitalSignResponse = {
  data: PatientVitalSign;
};

export type DeletePatientVitalSignResponse = void;
