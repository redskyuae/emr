import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  admissionIdSchema,
  cancelAdmissionSchema,
  type CancelAdmissionInput,
} from '../schemas/admission-schema';

export type ValidatedCancelAdmission = {
  id: number;
  payload: CancelAdmissionInput;
};

export function validateCancelAdmission(
  id: unknown,
  payload: unknown
): ValidationResult<ValidatedCancelAdmission> {
  const idResult = admissionIdSchema.safeParse(id);
  const payloadResult = cancelAdmissionSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Admission ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
