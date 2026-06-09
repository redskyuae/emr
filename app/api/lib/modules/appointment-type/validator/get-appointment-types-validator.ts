import type { ValidationResult } from '@/app/api/lib/utils/types';
import { appointmentTypeTenantIdSchema } from '../schemas/appointment-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetAppointmentTypes(tenantId: unknown): ValidationResult<string> {
  const result = appointmentTypeTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
