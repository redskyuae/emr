import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  admissionIdSchema,
  dischargeAdmissionSchema,
  type DischargeAdmissionInput,
} from '../schemas/admission-schema';

export type ValidatedDischargeAdmission = {
  id: number;
  payload: DischargeAdmissionInput;
};

export function validateDischargeAdmission(
  id: unknown,
  payload: unknown
): ValidationResult<ValidatedDischargeAdmission> {
  const idResult = admissionIdSchema.safeParse(id);
  const payloadResult = dischargeAdmissionSchema.safeParse(payload);

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
