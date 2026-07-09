import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { visitStatusRepository } from '../repository/visit-status-repository';

const VISIT_STATUS_NAME_EXISTS = "Visit status name '{value}' already exists.";
const VISIT_STATUS_CODE_EXISTS = "Visit status code '{value}' already exists.";

type VisitStatusUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateVisitStatusUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: VisitStatusUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    visitStatusRepository.findActiveByName(tenantId, name, { excludeId }),
    visitStatusRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(VISIT_STATUS_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(VISIT_STATUS_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getVisitStatusUniqueConstraintErrors(
  error: unknown,
  input: Pick<VisitStatusUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'visit_status_tenant_name_idx') {
    return [duplicateError(VISIT_STATUS_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'visit_status_tenant_code_idx') {
    return [duplicateError(VISIT_STATUS_CODE_EXISTS, input.code)];
  }

  return [];
}
