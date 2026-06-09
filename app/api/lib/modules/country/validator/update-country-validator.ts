import type { ValidationResult } from '@/app/api/lib/utils/types';
import { type UpdateCountryInput, updateCountrySchema } from '../schemas/country-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateUpdateCountry(payload: unknown): ValidationResult<UpdateCountryInput> {
  const result = updateCountrySchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
