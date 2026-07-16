import type { PatientAllergy } from '@/app/api/lib/modules/patient-allergy/schemas/patient-allergy-schema';

export type GetPatientAllergyResponse = {
  data: PatientAllergy;
};

export type UpdatePatientAllergyRequest = {
  allergenId?: number;
  substance?: string;
  reaction?: string;
  severity: string;
  status?: string;
  notedOn?: string;
  notes?: string;
};

export type UpdatePatientAllergyResponse = {
  data: PatientAllergy;
};

export type DeletePatientAllergyResponse = void;
