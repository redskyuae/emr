import type { PatientMedication } from '@/app/api/lib/modules/patient-medication/schemas/patient-medication-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListPatientMedicationsResponse = Paginated<PatientMedication>;

export type SavePatientMedicationRequest = {
  drugName: string;
  dose?: string;
  route?: string;
  frequency?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

export type SavePatientMedicationResponse = {
  data: PatientMedication;
};
