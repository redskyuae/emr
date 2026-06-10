import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createAppointmentCancelledReasonSchema,
  type CreateAppointmentCancelledReasonInput,
} from '../schemas/appointment-cancelled-reason-schema';
import { validateAppointmentCancelledReasonUniqueness } from './appointment-cancelled-reason-uniqueness-validator';

export async function validateCreateAppointmentCancelledReason(
  payload: unknown
): Promise<ValidationResult<CreateAppointmentCancelledReasonInput>> {
  const result = createAppointmentCancelledReasonSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAppointmentCancelledReasonUniqueness(result.data);

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: result.data };
}
