import type { PatientAllergy } from '@/app/api/lib/modules/patient-allergy/schemas/patient-allergy-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListPatientAllergiesResponse = Paginated<PatientAllergy>;

export type SavePatientAllergyRequest = {
  allergenId?: number;
  substance?: string;
  reaction?: string;
  severity: string;
  status?: string;
  notedOn?: string;
  notes?: string;
};

export type SavePatientAllergyResponse = {
  data: PatientAllergy;
};
