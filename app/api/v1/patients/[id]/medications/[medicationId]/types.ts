import type { PatientMedication } from '@/app/api/lib/modules/patient-medication/schemas/patient-medication-schema';

export type GetPatientMedicationResponse = {
  data: PatientMedication;
};

export type UpdatePatientMedicationRequest = {
  drugName: string;
  dose?: string;
  route?: string;
  frequency?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

export type UpdatePatientMedicationResponse = {
  data: PatientMedication;
};

export type DeletePatientMedicationResponse = void;
