import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { cancelVisitSchema, visitIdSchema, type CancelVisitInput } from '../schemas/visit-schema';

export type CancelVisitParams = {
  id: number;
  payload: CancelVisitInput;
};

export function validateCancelVisit(
  id: unknown,
  payload: unknown
): ValidationResult<CancelVisitParams> {
  const idResult = visitIdSchema.safeParse(id);
  const payloadResult = cancelVisitSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { id: idResult.data, payload: payloadResult.data },
  };
}
