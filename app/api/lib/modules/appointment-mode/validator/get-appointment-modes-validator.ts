import type { ValidationResult } from '@/app/api/lib/utils/types';
import { appointmentModeTenantIdSchema } from '../schemas/appointment-mode-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetAppointmentModes(
  tenantId: unknown
): ValidationResult<string> {
  const result = appointmentModeTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
