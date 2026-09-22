import type { ValidationResult } from '@/app/api/lib/utils/types';
import { therapistIdSchema, therapistTenantIdSchema } from '../schemas/therapist-schema';

export function validateGetTherapistById(
  id: unknown,
  tenantId: unknown
): ValidationResult<{ id: number; tenantId: string }> {
  const idResult = therapistIdSchema.safeParse(id);
  const tenantResult = therapistTenantIdSchema.safeParse(tenantId);
  if (!idResult.success || !tenantResult.success) {
    return {
      success: false,
      errors: [
        ...(idResult.success ? [] : [`Therapist ${String(id)} is Invalid.`]),
        ...(tenantResult.success ? [] : ['Tenant ID is required']),
      ],
    };
  }
  return { success: true, data: { id: idResult.data, tenantId: tenantResult.data } };
}
