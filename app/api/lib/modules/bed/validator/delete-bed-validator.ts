import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { bedIdSchema, bedTenantIdSchema } from '../schemas/bed-schema';

export type DeleteBedInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteBed(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteBedInput> {
  const idResult = bedIdSchema.safeParse(id);
  const tenantIdResult = bedTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Bed ${String(id)} is Invalid.`);
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
