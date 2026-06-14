import { StatusCodes } from 'http-status-codes';
import { auth } from '@/app/lib/auth';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { staffRepository } from '../repository/staff-repository';
import type { Staff } from '../schemas/staff-schema';
import { validateCreateStaff } from '../validator/create-staff-validator';
import { getStaffUniqueConstraintErrors } from '../validator/staff-uniqueness-validator';

async function cleanupCreatedUser(userId: string) {
  try {
    await staffRepository.deleteAuthUser(userId);
  } catch {
    // Preserve the original create failure; cleanup is best-effort.
  }
}

function getAuthCreateUserErrors(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as { body?: { code?: unknown; message?: unknown }; message?: unknown };
  const code = err.body?.code;
  const message = typeof err.message === 'string' ? err.message : err.body?.message;

  if (
    code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ||
    code === 'USER_ALREADY_EXISTS' ||
    message === 'User already exists. Use another email.'
  ) {
    return ['A user with this email already exists.'];
  }

  return [];
}

export async function createStaffCommand(
  payload: unknown,
  tenantId: string,
  assignedBy: string
): Promise<CommandResult<Staff>> {
  const validationResult = await validateCreateStaff(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  let createdUserId: string | undefined;

  try {
    const createdUser = await auth.api.createUser({
      body: {
        name: validationResult.data.name,
        email: validationResult.data.email,
        password: validationResult.data.password,
        data: {
          phone: validationResult.data.phone ?? null,
        },
      },
    });

    createdUserId = createdUser.user.id;

    const staff = await staffRepository.createStaffProfile(
      createdUser.user.id,
      tenantId,
      validationResult.data,
      assignedBy
    );

    if (!staff) {
      await cleanupCreatedUser(createdUser.user.id);
      createdUserId = undefined;

      return {
        success: false,
        errors: ['Staff not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: staff };
  } catch (error) {
    if (createdUserId) {
      await cleanupCreatedUser(createdUserId);
    }

    const constraintErrors = getStaffUniqueConstraintErrors(error, validationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    const authErrors = getAuthCreateUserErrors(error);

    if (authErrors.length > 0) {
      return { success: false, errors: authErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
