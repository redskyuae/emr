import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { admitSourceRepository } from '../repository/admit-source-repository';

const ADMIT_SOURCE_NAME_EXISTS = "Admit source name '{value}' already exists.";
const ADMIT_SOURCE_CODE_EXISTS = "Admit source code '{value}' already exists.";

type AdmitSourceUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAdmitSourceUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AdmitSourceUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    admitSourceRepository.findActiveByName(tenantId, name, { excludeId }),
    admitSourceRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(ADMIT_SOURCE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(ADMIT_SOURCE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAdmitSourceUniqueConstraintErrors(
  error: unknown,
  input: Pick<AdmitSourceUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'admit_source_tenant_name_idx') {
    return [duplicateError(ADMIT_SOURCE_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'admit_source_tenant_code_idx') {
    return [duplicateError(ADMIT_SOURCE_CODE_EXISTS, input.code)];
  }

  return [];
}
