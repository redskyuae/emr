import type { ValidationResult } from '@/app/api/lib/utils/types';
import { appointmentStatusTenantIdSchema } from '../schemas/appointment-status-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateGetAppointmentStatuses(tenantId: unknown): ValidationResult<string> {
  const result = appointmentStatusTenantIdSchema.safeParse(tenantId);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
