import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createAppointmentModeSchema,
  type CreateAppointmentModeInput,
} from '../schemas/appointment-mode-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateAppointmentModeUniqueness } from './appointment-mode-uniqueness-validator';

export async function validateCreateAppointmentMode(
  payload: unknown
): Promise<ValidationResult<CreateAppointmentModeInput>> {
  const result = createAppointmentModeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAppointmentModeUniqueness(result.data);

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: result.data };
}
