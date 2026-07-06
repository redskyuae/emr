import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { specialtyIdSchema, specialtyTenantIdSchema } from '../schemas/specialty-schema';

export type GetSpecialtyByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetSpecialtyById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetSpecialtyByIdInput> {
  const idResult = specialtyIdSchema.safeParse(id);
  const tenantIdResult = specialtyTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Specialty ${String(id)} is Invalid.`);
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
