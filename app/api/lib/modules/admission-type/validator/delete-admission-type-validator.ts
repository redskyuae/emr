import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  admissionTypeIdSchema,
  admissionTypeTenantIdSchema,
} from '../schemas/admission-type-schema';

export type DeleteAdmissionTypeInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteAdmissionType(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteAdmissionTypeInput> {
  const idResult = admissionTypeIdSchema.safeParse(id);
  const tenantIdResult = admissionTypeTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Admission type ${String(id)} is Invalid.`);
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
