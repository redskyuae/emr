import type {
  PatientTreatmentPlan,
  StartPatientTreatmentPlanSessionRequest as StartSessionRequest,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

export type StartPatientTreatmentPlanSessionRequest = StartSessionRequest;

export type StartPatientTreatmentPlanSessionResponse = {
  data: PatientTreatmentPlan;
};
