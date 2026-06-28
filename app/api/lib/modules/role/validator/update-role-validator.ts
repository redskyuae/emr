import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { roleRepository } from '../repository/role-repository';
import { roleIdSchema, updateRoleSchema, type UpdateRoleInput } from '../schemas/role-schema';
import { validateRoleUniqueness } from './role-uniqueness-validator';

export type UpdateRoleParams = {
  id: number;
  payload: UpdateRoleInput;
  tenantId: string;
};

function getImmutableCodeErrors(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [];
  }

  return 'code' in payload ? ['Role code cannot be changed.'] : [];
}

function omitImmutableFields(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const allowedPayload = { ...(payload as Record<string, unknown>) };
  delete allowedPayload.code;

  return allowedPayload;
}

export async function validateUpdateRole(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<UpdateRoleParams>> {
  const idResult = roleIdSchema.safeParse(id);
  const immutableCodeErrors = getImmutableCodeErrors(payload);
  const payloadResult = updateRoleSchema.safeParse(omitImmutableFields(payload));

  if (!idResult.success || immutableCodeErrors.length > 0 || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Role ${String(id)} is Invalid.`);
    }

    errors.push(...immutableCodeErrors);

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingRole = await roleRepository.getRoleById(idResult.data, tenantId);

  if (!existingRole) {
    return {
      success: false,
      errors: ['Role not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateRoleUniqueness({
    tenantId,
    name: payloadResult.data.name,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return {
    success: true,
    data: {
      tenantId,
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
