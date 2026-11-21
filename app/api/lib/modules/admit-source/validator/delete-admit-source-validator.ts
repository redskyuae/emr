import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admitSourceIdSchema, admitSourceTenantIdSchema } from '../schemas/admit-source-schema';

type DeleteAdmitSourceInput = {
  id: number;
  tenantId: string;
};

export function validateDeleteAdmitSource(
  id: unknown,
  tenantId: unknown
): ValidationResult<DeleteAdmitSourceInput> {
  const idResult = admitSourceIdSchema.safeParse(id);
  const tenantIdResult = admitSourceTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Admit source ${String(id)} is Invalid.`);
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
