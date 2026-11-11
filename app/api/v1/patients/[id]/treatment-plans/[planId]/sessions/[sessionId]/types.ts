import type {
  PatientTreatmentPlan,
  UpdatePatientTreatmentPlanSessionRequest as UpdateSessionRequest,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

export type UpdatePatientTreatmentPlanSessionRequest = UpdateSessionRequest;

export type UpdatePatientTreatmentPlanSessionResponse = {
  data: PatientTreatmentPlan;
};
