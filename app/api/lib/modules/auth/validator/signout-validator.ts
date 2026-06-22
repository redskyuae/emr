import type { ValidationResult } from '@/app/api/lib/utils/types';
import type { ValidatedSignoutInput } from '../schemas/signout-schema';

export function validateSignout(headers: unknown): ValidationResult<ValidatedSignoutInput> {
  if (!(headers instanceof Headers)) {
    return { success: false, errors: ['Request headers are required'] };
  }

  return { success: true, data: { headers } };
}
