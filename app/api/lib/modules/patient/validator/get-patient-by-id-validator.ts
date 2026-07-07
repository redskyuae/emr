import type { ValidationResult } from '@/app/api/lib/utils/types';
import { patientIdSchema, patientTenantIdSchema } from '../schemas/patient-schema';

export type GetPatientByIdParams = {
  id: number;
  tenantId: string;
};

export function validateGetPatientById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetPatientByIdParams> {
  const idResult = patientIdSchema.safeParse(id);
  const tenantIdResult = patientTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Patient ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...tenantIdResult.error.issues.map((issue) => issue.message));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
