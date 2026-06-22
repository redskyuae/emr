import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { signinSchema, type SigninInput } from '../schemas/signin-schema';

export function validateSignin(payload: unknown): ValidationResult<SigninInput> {
  const result = signinSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
