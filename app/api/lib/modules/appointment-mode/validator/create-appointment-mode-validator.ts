import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createAppointmentModeSchema,
  type CreateAppointmentModeInput,
} from '../schemas/appointment-mode-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateCreateAppointmentMode(
  payload: unknown
): ValidationResult<CreateAppointmentModeInput> {
  const result = createAppointmentModeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
