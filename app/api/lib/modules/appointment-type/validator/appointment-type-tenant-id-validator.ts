import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  appointmentTypeTenantIdSchema,
  type AppointmentTypeTenantIdInput,
} from '../schemas/appointment-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateAppointmentTypeTenantId(
  payload: unknown
): ValidationResult<AppointmentTypeTenantIdInput> {
  const result = appointmentTypeTenantIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
