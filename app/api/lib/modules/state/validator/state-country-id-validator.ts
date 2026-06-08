import type { ValidationResult } from '@/app/api/lib/utils/types';
import { stateCountryIdSchema, type StateCountryIdInput } from '../schemas/state-schema';

export function validateStateCountryId(payload: unknown): ValidationResult<StateCountryIdInput> {
  const result = stateCountryIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: ['countryId: Country ID must be a positive integer'] };
  }

  return { success: true, data: result.data };
}
