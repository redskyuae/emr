import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createAppointmentReasonSchema,
  type CreateAppointmentReasonInput,
} from '../schemas/appointment-reason-schema';
import { validateAppointmentReasonUniqueness } from './appointment-reason-uniqueness-validator';

export async function validateCreateAppointmentReason(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAppointmentReasonInput>> {
  const result = createAppointmentReasonSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAppointmentReasonUniqueness({
    ...result.data,
    tenantId,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: result.data };
}
