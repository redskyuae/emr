import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import type { PatientTreatmentPlan } from '../schemas/patient-treatment-plan-schema';
import { validateGetPatientTreatmentPlans } from '../validator/patient-treatment-plan-validator';

export async function getPatientTreatmentPlansQuery(
  patientId: unknown,
  tenantId: unknown,
  status: unknown
): Promise<SingleQueryResult<PatientTreatmentPlan[]>> {
  const validationResult = await validateGetPatientTreatmentPlans(patientId, tenantId, status);

  if (!validationResult.success) return validationResult;

  const plans = await patientTreatmentPlanRepository.getCurrentByPatientId(
    validationResult.data.patientId,
    validationResult.data.tenantId
  );

  return { success: true, data: plans };
}
