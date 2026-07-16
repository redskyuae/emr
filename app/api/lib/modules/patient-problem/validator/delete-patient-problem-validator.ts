import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  patientProblemIdSchema,
  patientProblemTenantIdSchema,
} from '../schemas/patient-problem-schema';

export type DeletePatientProblemInput = {
  id: number;
  tenantId: string;
};

export function validateDeletePatientProblem(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeletePatientProblemInput> {
  const idResult = patientProblemIdSchema.safeParse(id);
  const tenantIdResult = patientProblemTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Problem ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
