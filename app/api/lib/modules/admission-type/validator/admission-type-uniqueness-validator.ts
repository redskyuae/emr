import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { admissionTypeRepository } from '../repository/admission-type-repository';

const ADMISSION_TYPE_NAME_EXISTS = "Admission type name '{value}' already exists.";
const ADMISSION_TYPE_CODE_EXISTS = "Admission type code '{value}' already exists.";

type AdmissionTypeUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAdmissionTypeUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AdmissionTypeUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    admissionTypeRepository.findActiveByName(tenantId, name, { excludeId }),
    admissionTypeRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(ADMISSION_TYPE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(ADMISSION_TYPE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAdmissionTypeUniqueConstraintErrors(
  error: unknown,
  input: Pick<AdmissionTypeUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'admission_type_tenant_name_idx') {
    return [duplicateError(ADMISSION_TYPE_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'admission_type_tenant_code_idx') {
    return [duplicateError(ADMISSION_TYPE_CODE_EXISTS, input.code)];
  }

  return [];
}
