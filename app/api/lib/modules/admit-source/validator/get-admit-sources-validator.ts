import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admitSourceTenantIdSchema } from '../schemas/admit-source-schema';

export function validateGetAdmitSources(tenantId: unknown): ValidationResult<string> {
  const result = admitSourceTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
