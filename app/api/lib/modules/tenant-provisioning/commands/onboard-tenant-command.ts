import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { permissionRepository } from '../../permission/repository/permission-repository';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import type { Tenant } from '../../tenant/schemas/tenant-schema';
import { tenantProvisioningRepository } from '../repository/tenant-provisioning-repository';
import { validateTenantOnboarding } from '../validator/tenant-onboarding-validator';
import { seedDefaultAssetMastersCommand } from './seed-default-asset-masters-command';
import { seedDefaultWorkOrderMastersCommand } from './seed-default-work-order-masters-command';
import { seedDefaultAppointmentMastersCommand } from './seed-default-appointment-masters-command';

const seedDefaultMastersOperations = [
  {
    seedMasters: seedDefaultAppointmentMastersCommand,
    hasSeededMasters: (tenantId: string) =>
      tenantProvisioningRepository.hasSeededAppointmentMasters(tenantId),
  },
  {
    seedMasters: seedDefaultAssetMastersCommand,
    hasSeededMasters: (tenantId: string) =>
      tenantProvisioningRepository.hasSeededAssetMasters(tenantId),
  },
  {
    seedMasters: seedDefaultWorkOrderMastersCommand,
    hasSeededMasters: (tenantId: string) =>
      tenantProvisioningRepository.hasSeededWorkOrderMasters(tenantId),
  },
] as const;

export async function onboardTenantCommand(tenantId: unknown): Promise<CommandResult<Tenant>> {
  const validationResult = await validateTenantOnboarding(tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const tenant = validationResult.data;

  if (tenant.isOnboarded) {
    return { success: true, data: tenant };
  }

  try {
    await permissionRepository.seedPermissionCatalogue();

    // Seeding is not atomic: a failed attempt can leave some master families
    // seeded and others empty. Each family is seeded only while one of its
    // tables has never held a row for the tenant, so a retry completes a
    // partial onboarding, while tenants provisioned before the
    // signup/onboarding split keep their existing masters untouched —
    // re-seeding those would resurrect soft-deleted defaults.
    for (const { seedMasters, hasSeededMasters } of seedDefaultMastersOperations) {
      if (await hasSeededMasters(tenant.id)) {
        continue;
      }

      const seedResult = await seedMasters(tenant.id);

      if (!seedResult.success) {
        return {
          success: false,
          errors: seedResult.errors,
          status: seedResult.status ?? StatusCodes.INTERNAL_SERVER_ERROR,
        };
      }
    }

    const onboardedTenant = await tenantRepository.markTenantOnboarded(tenant.id);

    if (!onboardedTenant) {
      return {
        success: false,
        errors: ['Tenant onboarding failed.'],
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      };
    }

    return { success: true, data: onboardedTenant };
  } catch {
    return {
      success: false,
      errors: ['Tenant onboarding failed.'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
}
