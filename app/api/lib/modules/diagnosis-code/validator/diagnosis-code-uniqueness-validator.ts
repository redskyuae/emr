import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { diagnosisCodeRepository } from '../repository/diagnosis-code-repository';

const DIAGNOSIS_CODE_EXISTS = "Diagnosis code '{value}' already exists.";

type DiagnosisCodeUniquenessInput = {
  tenantId: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateDiagnosisCodeUniqueness({
  tenantId,
  code,
  excludeId,
}: DiagnosisCodeUniquenessInput): Promise<ValidationResult<void>> {
  const existingCode = await diagnosisCodeRepository.findActiveByCode(tenantId, code, {
    excludeId,
  });

  if (existingCode) {
    return {
      success: false,
      errors: [duplicateError(DIAGNOSIS_CODE_EXISTS, code)],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: undefined };
}

export function getDiagnosisCodeUniqueConstraintErrors(
  error: unknown,
  input: Pick<DiagnosisCodeUniquenessInput, 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'diagnosis_code_tenant_code_idx') {
    return [duplicateError(DIAGNOSIS_CODE_EXISTS, input.code)];
  }

  return [];
}
