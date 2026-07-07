import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { createPatientSchema, type CreatePatientInput } from '../schemas/patient-schema';
import { validatePatientGovtIdUniqueness } from './patient-govt-id-validator';
import { validatePatientReferences } from './patient-reference-validator';

export async function validateCreatePatient(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreatePatientInput>> {
  const payloadResult = createPatientSchema.safeParse(payload);

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
  }

  const referenceResult = await validatePatientReferences(payloadResult.data);

  if (!referenceResult.success) {
    return {
      success: false,
      errors: referenceResult.errors,
      status: referenceResult.status,
    };
  }

  const uniquenessResult = await validatePatientGovtIdUniqueness({
    tenantId,
    govtIdType: payloadResult.data.govtIdType,
    govtIdNumber: payloadResult.data.govtIdNumber,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: payloadResult.data };
}
