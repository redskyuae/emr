import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

export type ListPatientTreatmentPlansResponse = {
  data: PatientTreatmentPlan[];
};
