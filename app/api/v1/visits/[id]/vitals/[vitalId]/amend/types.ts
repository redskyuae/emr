import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';

export type AmendVisitVitalSignRequest = {
  spo2?: number | null;
  notes?: string;
  pulseBpm?: number | null;
  respRate?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  painScore?: number | null;
  recordedAt?: string | null;
  temperatureC?: number | null;
};

export type AmendVisitVitalSignResponse = {
  data: PatientVitalSign;
};
