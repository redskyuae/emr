import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateAppointmentTypeInput,
  updateAppointmentTypeSchema,
} from '../schemas/appointment-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateUpdateAppointmentType(
  payload: unknown
): ValidationResult<UpdateAppointmentTypeInput> {
  const result = updateAppointmentTypeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
