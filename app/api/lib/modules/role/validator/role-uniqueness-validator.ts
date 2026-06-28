import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { roleRepository } from '../repository/role-repository';
const ROLE_NAME_EXISTS = 'Role name {value} already exists.';
const ROLE_CODE_EXISTS = 'Role code {value} already exists.';

type RoleUniquenessInput = {
  code?: string;
  name?: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateRoleUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: RoleUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    name ? roleRepository.findActiveByName(tenantId, name, { excludeId }) : undefined,
    code ? roleRepository.findActiveByCode(tenantId, code, { excludeId }) : undefined,
  ]);

  const errors: string[] = [];

  if (name && existingName) {
    errors.push(duplicateError(ROLE_NAME_EXISTS, name));
  }

  if (code && existingCode) {
    errors.push(duplicateError(ROLE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getRoleUniqueConstraintErrors(
  error: unknown,
  input: Pick<RoleUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'role_tenant_name_idx' && input.name) {
    return [duplicateError(ROLE_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'role_tenant_code_idx' && input.code) {
    return [duplicateError(ROLE_CODE_EXISTS, input.code)];
  }

  return [];
}
