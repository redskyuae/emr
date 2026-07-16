import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { allergenRepository } from '../repository/allergen-repository';

const ALLERGEN_NAME_EXISTS = "Allergen name '{value}' already exists.";
const ALLERGEN_CODE_EXISTS = "Allergen code '{value}' already exists.";

type AllergenUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAllergenUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AllergenUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    allergenRepository.findActiveByName(tenantId, name, { excludeId }),
    allergenRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(ALLERGEN_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(ALLERGEN_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAllergenUniqueConstraintErrors(
  error: unknown,
  input: Pick<AllergenUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'allergen_tenant_name_idx') {
    return [duplicateError(ALLERGEN_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'allergen_tenant_code_idx') {
    return [duplicateError(ALLERGEN_CODE_EXISTS, input.code)];
  }

  return [];
}
