import type { PatientProblem } from '@/app/api/lib/modules/patient-problem/schemas/patient-problem-schema';

export type GetPatientProblemResponse = {
  data: PatientProblem;
};

export type UpdatePatientProblemRequest = {
  diagnosisCodeId?: number;
  title?: string;
  clinicalStatus?: string;
  onsetDate?: string;
  resolvedDate?: string;
  notes?: string;
};

export type UpdatePatientProblemResponse = {
  data: PatientProblem;
};

export type DeletePatientProblemResponse = void;
