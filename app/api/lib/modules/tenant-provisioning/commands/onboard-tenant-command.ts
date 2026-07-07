import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { permissionRepository } from '../../permission/repository/permission-repository';
import { seedSystemRolesCommand } from '../../role/commands/seed-system-roles-command';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import type { Tenant } from '../../tenant/schemas/tenant-schema';
import { tenantProvisioningRepository } from '../repository/tenant-provisioning-repository';
import { validateTenantOnboarding } from '../validator/tenant-onboarding-validator';
import { seedDefaultAssetMastersCommand } from './seed-default-asset-masters-command';
import { seedDefaultSpecialtiesCommand } from './seed-default-specialties-command';
import { seedDefaultWorkOrderMastersCommand } from './seed-default-work-order-masters-command';
import { seedDefaultAppointmentMastersCommand } from './seed-default-appointment-masters-command';

const seedDefaultMastersOperations = [
  {
    seedMasters: seedDefaultSpecialtiesCommand,
    hasSeededMasters: (tenantId: string) =>
      tenantProvisioningRepository.hasSeededSpecialties(tenantId),
    isLegacyMasterFamily: false,
  },
  {
    seedMasters: seedDefaultAppointmentMastersCommand,
    hasSeededMasters: (tenantId: string) =>
      tenantProvisioningRepository.hasSeededAppointmentMasters(tenantId),
    isLegacyMasterFamily: true,
  },
  {
    seedMasters: seedDefaultAssetMastersCommand,
    hasSeededMasters: (tenantId: string) =>
      tenantProvisioningRepository.hasSeededAssetMasters(tenantId),
    isLegacyMasterFamily: true,
  },
  {
    seedMasters: seedDefaultWorkOrderMastersCommand,
    hasSeededMasters: (tenantId: string) =>
      tenantProvisioningRepository.hasSeededWorkOrderMasters(tenantId),
    isLegacyMasterFamily: true,
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
    const masterFamilyStates = await Promise.all(
      seedDefaultMastersOperations.map(async (operation) => ({
        ...operation,
        isSeeded: await operation.hasSeededMasters(tenant.id),
      }))
    );
    const isLegacyTenant = masterFamilyStates
      .filter(({ isLegacyMasterFamily }) => isLegacyMasterFamily)
      .every(({ isSeeded }) => isSeeded);

    if (!isLegacyTenant) {
      const seedRolesResult = await seedSystemRolesCommand(tenant.id);

      if (!seedRolesResult.success) {
        return {
          success: false,
          errors: seedRolesResult.errors,
          status: seedRolesResult.status ?? StatusCodes.INTERNAL_SERVER_ERROR,
        };
      }
    }

    for (const { seedMasters, isSeeded, isLegacyMasterFamily } of masterFamilyStates) {
      // Tenants created before Specialty joined onboarding can have every older
      // master family but no Specialty rows. They must not be backfilled.
      if (isSeeded || (isLegacyTenant && !isLegacyMasterFamily)) {
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
