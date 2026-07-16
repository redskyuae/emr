import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  patientProblemIdSchema,
  patientProblemTenantIdSchema,
} from '../schemas/patient-problem-schema';

export type GetPatientProblemsInput = {
  patientId: number;
  tenantId: string;
};

export function validateGetPatientProblems(
  patientId: unknown,
  tenantId: unknown
): ValidationResult<GetPatientProblemsInput> {
  const patientIdResult = patientProblemIdSchema.safeParse(patientId);
  const tenantIdResult = patientProblemTenantIdSchema.safeParse(tenantId);

  if (!patientIdResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!patientIdResult.success) {
      errors.push(`Patient ${String(patientId)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { patientId: patientIdResult.data, tenantId: tenantIdResult.data },
  };
}
