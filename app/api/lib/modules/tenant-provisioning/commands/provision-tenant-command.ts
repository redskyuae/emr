import { StatusCodes } from 'http-status-codes';

import { auth } from '@/app/lib/auth';
import { createCookieHeader, getSetCookies } from '@/app/api/lib/utils/auth-cookie-helpers';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { permissionRepository } from '../../permission/repository/permission-repository';
import { seedSystemRolesCommand } from '../../role/commands/seed-system-roles-command';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { getTenantUniqueConstraintErrors } from '../../tenant/validator/tenant-uniqueness-validator';
import type { TenantProvisioningResult } from '../schemas/tenant-provisioning-schema';
import { tenantProvisioningRepository } from '../repository/tenant-provisioning-repository';
import { validateTenantProvisioning } from '../validator/tenant-provisioning-validator';
import { seedDefaultAppointmentMastersCommand } from './seed-default-appointment-masters-command';

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

async function cleanupCreatedProvisioning({
  tenantId,
  userId,
}: {
  tenantId?: string;
  userId?: string;
}) {
  try {
    if (tenantId) {
      await tenantProvisioningRepository.deleteTenantArtifacts(tenantId);
    }
  } catch {
    // Preserve the original provisioning failure; cleanup is best-effort.
  }

  try {
    if (userId) {
      await tenantProvisioningRepository.deleteAuthUser(userId);
    }
  } catch {
    // Preserve the original provisioning failure; cleanup is best-effort.
  }
}

export async function provisionTenantCommand(
  payload: unknown,
  requestHeaders?: Headers
): Promise<CommandResult<TenantProvisioningResult>> {
  const validationResult = await validateTenantProvisioning(payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  let createdUserId: string | undefined;
  let createdTenantId: string | undefined;

  try {
    await permissionRepository.seedPermissionCatalogue();

    const createdUser = await auth.api.createUser({
      body: {
        name: validationResult.data.ownerName,
        email: validationResult.data.ownerEmail,
        password: validationResult.data.password,
      },
    });

    createdUserId = createdUser.user.id;

    const createdOrganization = await auth.api.createOrganization({
      body: {
        name: validationResult.data.tenantName,
        slug: validationResult.data.tenantSlug,
        userId: createdUser.user.id,
        metadata: { isActive: true },
      },
    });

    createdTenantId = createdOrganization.id;

    const createdTenant = await tenantRepository.getTenantById(createdOrganization.id);

    if (!createdTenant) {
      await cleanupCreatedProvisioning({ tenantId: createdTenantId, userId: createdUserId });
      createdTenantId = undefined;
      createdUserId = undefined;

      return {
        success: false,
        errors: ['Tenant provisioning failed.'],
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }

    const [rolesResult, appointmentMastersResult] = await Promise.all([
      seedSystemRolesCommand(createdTenant.id),
      seedDefaultAppointmentMastersCommand(createdTenant.id),
    ]);

    if (!rolesResult.success) {
      await cleanupCreatedProvisioning({ tenantId: createdTenant.id, userId: createdUser.user.id });
      createdTenantId = undefined;
      createdUserId = undefined;

      return {
        success: false,
        errors: rolesResult.errors,
        status: rolesResult.status ?? StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }

    if (!appointmentMastersResult.success) {
      await cleanupCreatedProvisioning({ tenantId: createdTenant.id, userId: createdUser.user.id });
      createdTenantId = undefined;
      createdUserId = undefined;

      return {
        success: false,
        errors: appointmentMastersResult.errors,
        status: appointmentMastersResult.status ?? StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }

    const signInResult = await auth.api.signInEmail({
      body: {
        email: validationResult.data.ownerEmail,
        password: validationResult.data.password,
      },
      headers: requestHeaders,
      returnHeaders: true,
    });
    const signInSetCookies = getSetCookies(signInResult.headers);
    const cookieHeader = createCookieHeader(signInSetCookies);

    if (!cookieHeader) {
      throw new Error('Signup session cookie was not created.');
    }

    const setActiveResult = await auth.api.setActiveOrganization({
      body: { organizationId: createdTenant.id },
      headers: new Headers({ cookie: cookieHeader }),
      returnHeaders: true,
    });
    const setActiveSetCookies = getSetCookies(setActiveResult.headers);

    return {
      success: true,
      data: {
        tenant: createdTenant,
        setCookies: [...signInSetCookies, ...setActiveSetCookies],
      },
    };
  } catch (error) {
    await cleanupCreatedProvisioning({ tenantId: createdTenantId, userId: createdUserId });

    const authErrors = getAuthCreateUserErrors(error);

    if (authErrors.length > 0) {
      return { success: false, errors: authErrors, status: StatusCodes.CONFLICT };
    }

    const tenantErrors = getTenantUniqueConstraintErrors(error);

    if (tenantErrors.length > 0) {
      return { success: false, errors: tenantErrors, status: StatusCodes.CONFLICT };
    }

    return {
      success: false,
      errors: ['Tenant provisioning failed.'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
}
