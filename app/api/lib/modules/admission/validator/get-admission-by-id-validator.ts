import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admissionIdSchema, admissionTenantIdSchema } from '../schemas/admission-schema';

export type GetAdmissionByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetAdmissionById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetAdmissionByIdInput> {
  const idResult = admissionIdSchema.safeParse(id);
  const tenantIdResult = admissionTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Admission ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
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
