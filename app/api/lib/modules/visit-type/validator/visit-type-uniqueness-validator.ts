import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { visitTypeRepository } from '../repository/visit-type-repository';

const VISIT_TYPE_NAME_EXISTS = "Visit type name '{value}' already exists.";
const VISIT_TYPE_CODE_EXISTS = "Visit type code '{value}' already exists.";

type VisitTypeUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateVisitTypeUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: VisitTypeUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    visitTypeRepository.findActiveByName(tenantId, name, { excludeId }),
    visitTypeRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(VISIT_TYPE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(VISIT_TYPE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getVisitTypeUniqueConstraintErrors(
  error: unknown,
  input: Pick<VisitTypeUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'visit_type_tenant_name_idx') {
    return [duplicateError(VISIT_TYPE_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'visit_type_tenant_code_idx') {
    return [duplicateError(VISIT_TYPE_CODE_EXISTS, input.code)];
  }

  return [];
}
