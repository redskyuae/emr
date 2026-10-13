import type {
  AddPatientTreatmentPlanSessionsRequest as AddSessionsRequest,
  PatientTreatmentPlan,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

export type ListPatientTreatmentPlansResponse = {
  data: PatientTreatmentPlan[];
};

export type AddPatientTreatmentPlanSessionsRequest = AddSessionsRequest;

export type AddPatientTreatmentPlanSessionsResponse = {
  data: PatientTreatmentPlan;
};
