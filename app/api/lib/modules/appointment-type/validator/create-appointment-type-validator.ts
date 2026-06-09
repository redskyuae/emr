import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createAppointmentTypeSchema,
  type CreateAppointmentTypeInput,
} from '../schemas/appointment-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateCreateAppointmentType(
  payload: unknown
): ValidationResult<CreateAppointmentTypeInput> {
  const result = createAppointmentTypeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
