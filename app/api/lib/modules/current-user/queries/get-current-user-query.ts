import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { hasTenantAdminRole } from '@/app/api/lib/utils/auth-helpers';
import { staffRepository } from '../../staff/repository/staff-repository';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { userRoleRepository } from '../../user-role/repository/user-role-repository';
import { currentUserRepository } from '../repository/current-user-repository';
import type { CurrentUser } from '../schemas/current-user-schema';

export async function getCurrentUserQuery(
  userId: string,
  tenantId: string
): Promise<SingleQueryResult<CurrentUser>> {
  const authUser = await currentUserRepository.getAuthUserById(userId);

  if (!authUser) {
    return { success: false, errors: ['User not found'], status: StatusCodes.NOT_FOUND };
  }

  const membership = await tenantRepository.findTenantMembership(tenantId, userId);

  if (!membership) {
    return {
      success: false,
      errors: ['You are not a member of the active tenant.'],
      status: StatusCodes.FORBIDDEN,
    };
  }

  const tenant = await tenantRepository.getTenantById(tenantId);

  if (!tenant) {
    return { success: false, errors: ['Tenant not found'], status: StatusCodes.NOT_FOUND };
  }

  const [staff, assignedRoles] = await Promise.all([
    staffRepository.getStaffByUserId(userId, tenantId),
    userRoleRepository.getAssignedRolesByUser(userId, tenantId),
  ]);

  const permissionKeys = hasTenantAdminRole(membership.role)
    ? await currentUserRepository.getAllActivePermissionKeys()
    : await currentUserRepository.getPermissionKeysByRoleIds(
        assignedRoles.map((role) => role.id),
        tenantId
      );

  return {
    success: true,
    data: {
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        image: authUser.image,
        phone: authUser.phone,
        emailVerified: authUser.emailVerified,
        staffProfile: staff
          ? {
              gender: staff.gender,
              isActive: staff.isActive,
              staffCode: staff.staffCode,
              designation: staff.designation,
              dateOfBirth: staff.dateOfBirth,
            }
          : null,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        isActive: tenant.isActive,
      },
      membership: { role: membership.role },
      permissions: Array.from(new Set(permissionKeys)).sort(),
      roles: assignedRoles.map((role) => ({ id: role.id, name: role.name, code: role.code })),
    },
  };
}
