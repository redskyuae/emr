import type { PatientProblem } from '@/app/api/lib/modules/patient-problem/schemas/patient-problem-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListPatientProblemsResponse = Paginated<PatientProblem>;

export type SavePatientProblemRequest = {
  diagnosisCodeId?: number;
  title?: string;
  clinicalStatus?: string;
  onsetDate?: string;
  resolvedDate?: string;
  notes?: string;
};

export type SavePatientProblemResponse = {
  data: PatientProblem;
};
