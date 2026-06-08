import type { ValidationResult } from '@/app/api/lib/utils/types';
import { stateIdSchema, type StateIdInput } from '../schemas/state-schema';

export function validateStateId(payload: unknown): ValidationResult<StateIdInput> {
  const result = stateIdSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: [`State ${String(payload)} is Invalid.`] };
  }

  return { success: true, data: result.data };
}
