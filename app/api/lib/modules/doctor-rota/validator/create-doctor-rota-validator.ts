import type { ValidationResult } from '@/app/api/lib/utils/types';
import { createDoctorRotaSchema, type CreateDoctorRotaInput } from '../schemas/doctor-rota-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateDoctorRotaUniqueness } from './doctor-rota-uniqueness-validator';

export async function validateCreateDoctorRota(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateDoctorRotaInput>> {
  const result = createDoctorRotaSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateDoctorRotaUniqueness({
    name: result.data.name,
    toTime: result.data.toTime,
    tenantId,
    fromTime: result.data.fromTime,
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
