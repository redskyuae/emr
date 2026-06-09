import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateAppointmentModeInput,
  updateAppointmentModeSchema,
} from '../schemas/appointment-mode-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateUpdateAppointmentMode(
  payload: unknown
): ValidationResult<UpdateAppointmentModeInput> {
  const result = updateAppointmentModeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
