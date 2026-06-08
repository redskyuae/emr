import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  appointmentModeTenantIdSchema,
  type AppointmentModeTenantIdInput,
} from '../schemas/appointment-mode-schema';
import { formatValidationErrors } from './validation-errors';

export function validateAppointmentModeTenantId(
  payload: unknown
): ValidationResult<AppointmentModeTenantIdInput> {
  const result = appointmentModeTenantIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
