import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { auth } from '@/app/lib/auth';
import { roleRepository } from '../../role/repository/role-repository';
import { StaffTenantMembershipConflictError } from '../../staff/errors/staff-tenant-membership-conflict-error';
import { staffRepository } from '../../staff/repository/staff-repository';
import { therapistRepository } from '../repository/therapist-repository';
import type { Therapist } from '../schemas/therapist-schema';
import { validateCreateTherapist } from '../validator/create-therapist-validator';
import { getTherapistUniqueConstraintErrors } from '../validator/therapist-uniqueness-validator';

export async function createTherapistCommand(
  payload: unknown,
  tenantId: string,
  assignedBy: string
): Promise<CommandResult<Therapist>> {
  const validation = await validateCreateTherapist(payload, tenantId);
  if (!validation.success) return validation;
  const role = await roleRepository.getSystemRoleByCode(tenantId, 'THERAPIST');
  if (!role)
    return { success: false, errors: ['Therapist role not found'], status: StatusCodes.NOT_FOUND };
  let userId: string | undefined;
  try {
    const created = await auth.api.createUser({
      body: {
        name: validation.data.name,
        email: validation.data.email,
        password: validation.data.password,
      },
    });
    userId = created.user.id;
    const therapist = await therapistRepository.createTherapist({
      ...validation.data,
      userId,
      tenantId,
      roleId: role.id,
      assignedBy,
    });
    return { success: true, data: therapist };
  } catch (error) {
    if (userId) {
      try {
        await staffRepository.deleteAuthUserIfUnprovisioned(userId);
      } catch {
        // Best-effort cleanup: preserve the original provisioning error.
      }
    }
    if (error instanceof StaffTenantMembershipConflictError) {
      return { success: false, errors: [error.message], status: StatusCodes.CONFLICT };
    }
    const errors = getTherapistUniqueConstraintErrors(error, validation.data.registrationNumber);
    if (errors.length > 0) return { success: false, errors, status: StatusCodes.CONFLICT };
    throw error;
  }
}
