import type { ValidationResult } from '@/app/api/lib/utils/types';
import { countryIdSchema, type CountryIdInput } from '../schemas/country-schema';

export function validateCountryId(payload: unknown): ValidationResult<CountryIdInput> {
  const result = countryIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: [`Country ${String(payload)} is Invalid.`] };
  }

  return { success: true, data: result.data };
}
