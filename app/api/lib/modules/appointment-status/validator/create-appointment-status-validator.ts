import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createAppointmentStatusSchema,
  type CreateAppointmentStatusInput,
} from '../schemas/appointment-status-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateAppointmentStatusUniqueness } from './appointment-status-uniqueness-validator';

export async function validateCreateAppointmentStatus(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAppointmentStatusInput>> {
  const result = createAppointmentStatusSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAppointmentStatusUniqueness({
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
