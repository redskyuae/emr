import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { treatmentRepository } from '../repository/treatment-repository';

const TREATMENT_NAME_EXISTS = "Treatment name '{value}' already exists.";
const TREATMENT_CODE_EXISTS = "Treatment code '{value}' already exists.";

type TreatmentUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateTreatmentUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: TreatmentUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    treatmentRepository.findActiveByName(tenantId, name, { excludeId }),
    treatmentRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(TREATMENT_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(TREATMENT_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getTreatmentUniqueConstraintErrors(
  error: unknown,
  input: Pick<TreatmentUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'treatment_tenant_name_idx') {
    return [duplicateError(TREATMENT_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'treatment_tenant_code_idx') {
    return [duplicateError(TREATMENT_CODE_EXISTS, input.code)];
  }

  return [];
}
