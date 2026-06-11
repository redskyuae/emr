import { headers } from 'next/headers';

import { auth } from '@/app/lib/auth';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { seedSystemRolesCommand } from '../../role/commands/seed-system-roles-command';
import type { Tenant } from '../schemas/tenant-schema';
import { tenantRepository } from '../repository/tenant-repository';
import { validateCreateTenant } from '../validator/create-tenant-validator';
import { getTenantUniqueConstraintErrors } from '../validator/tenant-uniqueness-validator';

const CONFLICT_STATUS = 409;

export async function createTenantCommand(payload: unknown): Promise<CommandResult<Tenant>> {
  const validationResult = await validateCreateTenant(payload);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  try {
    const createdOrganization = await auth.api.createOrganization({
      body: {
        name: validationResult.data.name,
        slug: validationResult.data.slug,
        logo: validationResult.data.logo,
        metadata: { isActive: true },
      },
      headers: await headers(),
    });

    const createdTenant = await tenantRepository.getTenantById(createdOrganization.id);

    if (!createdTenant) {
      return {
        success: false,
        errors: ['Tenant not found'],
        status: 404,
      };
    }

    const seedResult = await seedSystemRolesCommand(createdTenant.id);

    if (!seedResult.success) {
      return {
        success: false,
        errors: seedResult.errors,
        status: seedResult.status ?? 500,
      };
    }

    return { success: true, data: createdTenant };
  } catch (error) {
    const constraintErrors = getTenantUniqueConstraintErrors(error);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
    }

    throw error;
  }
}
