import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createAppointmentTypeSchema,
  type CreateAppointmentTypeInput,
} from '../schemas/appointment-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateAppointmentTypeUniqueness } from './appointment-type-uniqueness-validator';

export async function validateCreateAppointmentType(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAppointmentTypeInput>> {
  const result = createAppointmentTypeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAppointmentTypeUniqueness({
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
