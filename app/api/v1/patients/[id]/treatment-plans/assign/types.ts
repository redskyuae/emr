import type {
  AssignPatientTreatmentPlanRequest as AssignRequest,
  PatientTreatmentPlan,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

export type AssignPatientTreatmentPlanRequest = AssignRequest;
export type AssignPatientTreatmentPlanResponse = { data: PatientTreatmentPlan };
