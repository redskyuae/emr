import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { auth } from '@/app/lib/auth';
import { roleRepository } from '../../role/repository/role-repository';
import { staffRepository } from '../../staff/repository/staff-repository';
import { doctorRepository } from '../repository/doctor-repository';
import type { Doctor } from '../schemas/doctor-schema';
import {
  doctorEmailExistsError,
  getDoctorUniqueConstraintErrors,
} from '../validator/doctor-uniqueness-validator';
import { validateCreateDoctor } from '../validator/create-doctor-validator';

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
    return [doctorEmailExistsError()];
  }

  return [];
}

export async function createDoctorCommand(
  payload: unknown,
  tenantId: string,
  assignedBy: string
): Promise<CommandResult<Doctor>> {
  const validationResult = await validateCreateDoctor(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const doctorRole = await roleRepository.getSystemRoleByCode(tenantId, 'DOCTOR');

  if (!doctorRole) {
    return {
      success: false,
      errors: ['Doctor role not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  let createdUserId: string | undefined;

  try {
    // BetterAuth user creation cannot join the Drizzle transaction used for the
    // rest of the Doctor aggregate. If that transaction fails, the user is
    // explicitly removed so no partial Staff identity remains.
    const createdUser = await auth.api.createUser({
      body: {
        name: validationResult.data.name,
        email: validationResult.data.email,
        password: validationResult.data.password,
      },
    });

    createdUserId = createdUser.user.id;

    const doctor = await doctorRepository.createDoctor({
      ...validationResult.data,
      userId: createdUser.user.id,
      tenantId,
      roleId: doctorRole.id,
      assignedBy,
    });

    return { success: true, data: doctor };
  } catch (error) {
    if (createdUserId) {
      await cleanupCreatedUser(createdUserId);
    }

    const constraintErrors = getDoctorUniqueConstraintErrors(error, validationResult.data);

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
