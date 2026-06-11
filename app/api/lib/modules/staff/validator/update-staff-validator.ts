import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { staffRepository } from '../repository/staff-repository';
import {
  staffUserIdSchema,
  updateStaffSchema,
  type UpdateStaffInput,
} from '../schemas/staff-schema';
import { validateStaffUniqueness } from './staff-uniqueness-validator';

const NOT_FOUND_STATUS = 404;

export type UpdateStaffParams = {
  userId: string;
  tenantId: string;
  payload: UpdateStaffInput;
};

function getForbiddenCredentialUpdateErrors(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [];
  }

  const errors: string[] = [];

  if ('email' in payload) {
    errors.push('Email cannot be changed through this endpoint.');
  }

  if ('password' in payload) {
    errors.push('Password cannot be changed through this endpoint.');
  }

  return errors;
}

function omitForbiddenCredentialFields(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const allowedPayload = { ...(payload as Record<string, unknown>) };
  delete allowedPayload.email;
  delete allowedPayload.password;

  return allowedPayload;
}

export async function validateUpdateStaff(
  userId: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<UpdateStaffParams>> {
  const idResult = staffUserIdSchema.safeParse(userId);
  const forbiddenErrors = getForbiddenCredentialUpdateErrors(payload);
  const payloadResult = updateStaffSchema.safeParse(omitForbiddenCredentialFields(payload));

  if (!idResult.success || forbiddenErrors.length > 0 || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(...formatValidationErrors(idResult.error));
    }

    errors.push(...forbiddenErrors);

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingStaff = await staffRepository.getStaffByUserId(idResult.data, tenantId);

  if (!existingStaff) {
    return {
      success: false,
      errors: ['Staff not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  const uniquenessResult = await validateStaffUniqueness({
    tenantId,
    staffCode: payloadResult.data.staffCode,
    excludeUserId: idResult.data,
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
      userId: idResult.data,
      tenantId,
      payload: payloadResult.data,
    },
  };
}
