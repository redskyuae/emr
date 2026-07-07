import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { permissionRepository } from '../../permission/repository/permission-repository';
import { seedSystemRolesCommand } from '../../role/commands/seed-system-roles-command';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { tenantProvisioningRepository } from '../repository/tenant-provisioning-repository';
import { validateTenantOnboarding } from '../validator/tenant-onboarding-validator';
import { onboardTenantCommand } from './onboard-tenant-command';
import { seedDefaultAssetMastersCommand } from './seed-default-asset-masters-command';
import { seedDefaultSpecialtiesCommand } from './seed-default-specialties-command';
import { seedDefaultWorkOrderMastersCommand } from './seed-default-work-order-masters-command';
import { seedDefaultAppointmentMastersCommand } from './seed-default-appointment-masters-command';

vi.mock('../validator/tenant-onboarding-validator', () => ({
  validateTenantOnboarding: vi.fn(),
}));

vi.mock('../../permission/repository/permission-repository', () => ({
  permissionRepository: {
    seedPermissionCatalogue: vi.fn(),
  },
}));

vi.mock('../../role/commands/seed-system-roles-command', () => ({
  seedSystemRolesCommand: vi.fn(),
}));

vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: {
    markTenantOnboarded: vi.fn(),
  },
}));

vi.mock('../repository/tenant-provisioning-repository', () => ({
  tenantProvisioningRepository: {
    hasSeededSpecialties: vi.fn(),
    hasSeededAssetMasters: vi.fn(),
    hasSeededWorkOrderMasters: vi.fn(),
    hasSeededAppointmentMasters: vi.fn(),
  },
}));

vi.mock('./seed-default-appointment-masters-command', () => ({
  seedDefaultAppointmentMastersCommand: vi.fn(),
}));

vi.mock('./seed-default-asset-masters-command', () => ({
  seedDefaultAssetMastersCommand: vi.fn(),
}));

vi.mock('./seed-default-specialties-command', () => ({
  seedDefaultSpecialtiesCommand: vi.fn(),
}));

vi.mock('./seed-default-work-order-masters-command', () => ({
  seedDefaultWorkOrderMastersCommand: vi.fn(),
}));

const validate = vi.mocked(validateTenantOnboarding);
const permissionRepo = vi.mocked(permissionRepository);
const seedSystemRoles = vi.mocked(seedSystemRolesCommand);
const tenantRepo = vi.mocked(tenantRepository);
const provisioningRepo = vi.mocked(tenantProvisioningRepository);
const seedAppointmentMasters = vi.mocked(seedDefaultAppointmentMastersCommand);
const seedAssetMasters = vi.mocked(seedDefaultAssetMastersCommand);
const seedSpecialties = vi.mocked(seedDefaultSpecialtiesCommand);
const seedWorkOrderMasters = vi.mocked(seedDefaultWorkOrderMastersCommand);

const tenant = {
  id: 'org-1',
  name: 'Apollo',
  slug: 'apollo',
  createdAt: new Date(),
  isActive: true,
  logo: null,
  isOnboarded: false,
};

const onboardedTenant = { ...tenant, isOnboarded: true };

describe('OnboardTenant command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockResolvedValue({ success: true, data: tenant });
    permissionRepo.seedPermissionCatalogue.mockResolvedValue(undefined);
    seedSystemRoles.mockResolvedValue({ success: true, data: [] });
    provisioningRepo.hasSeededSpecialties.mockResolvedValue(false);
    provisioningRepo.hasSeededAssetMasters.mockResolvedValue(false);
    provisioningRepo.hasSeededWorkOrderMasters.mockResolvedValue(false);
    provisioningRepo.hasSeededAppointmentMasters.mockResolvedValue(false);
    seedAppointmentMasters.mockResolvedValue({ success: true, data: undefined });
    seedAssetMasters.mockResolvedValue({ success: true, data: undefined });
    seedSpecialties.mockResolvedValue({ success: true, data: undefined });
    seedWorkOrderMasters.mockResolvedValue({ success: true, data: undefined });
    tenantRepo.markTenantOnboarded.mockResolvedValue(onboardedTenant);
  });

  it('should return validation failure and not seed when the validator fails', async () => {
    validate.mockResolvedValue({
      success: false,
      errors: ['Tenant not found'],
      status: StatusCodes.NOT_FOUND,
    });

    const result = await onboardTenantCommand('org-missing');

    expect(result).toEqual({
      success: false,
      errors: ['Tenant not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(permissionRepo.seedPermissionCatalogue).not.toHaveBeenCalled();
    expect(seedSystemRoles).not.toHaveBeenCalled();
    expect(seedAppointmentMasters).not.toHaveBeenCalled();
    expect(seedAssetMasters).not.toHaveBeenCalled();
    expect(seedSpecialties).not.toHaveBeenCalled();
    expect(seedWorkOrderMasters).not.toHaveBeenCalled();
    expect(tenantRepo.markTenantOnboarded).not.toHaveBeenCalled();
  });

  it('should return success without re-seeding when the tenant is already onboarded', async () => {
    validate.mockResolvedValue({ success: true, data: onboardedTenant });

    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({ success: true, data: onboardedTenant });
    expect(permissionRepo.seedPermissionCatalogue).not.toHaveBeenCalled();
    expect(seedSystemRoles).not.toHaveBeenCalled();
    expect(seedAppointmentMasters).not.toHaveBeenCalled();
    expect(seedAssetMasters).not.toHaveBeenCalled();
    expect(seedSpecialties).not.toHaveBeenCalled();
    expect(seedWorkOrderMasters).not.toHaveBeenCalled();
    expect(tenantRepo.markTenantOnboarded).not.toHaveBeenCalled();
  });

  it('should seed the catalogue and all default masters then mark the tenant onboarded', async () => {
    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({ success: true, data: onboardedTenant });
    expect(permissionRepo.seedPermissionCatalogue).toHaveBeenCalledTimes(1);
    expect(seedSystemRoles).toHaveBeenCalledWith('org-1');
    expect(seedSpecialties).toHaveBeenCalledWith('org-1');
    expect(seedAppointmentMasters).toHaveBeenCalledWith('org-1');
    expect(seedAssetMasters).toHaveBeenCalledWith('org-1');
    expect(seedWorkOrderMasters).toHaveBeenCalledWith('org-1');
    expect(tenantRepo.markTenantOnboarded).toHaveBeenCalledWith('org-1');
    expect(seedSystemRoles.mock.invocationCallOrder[0]).toBeLessThan(
      seedSpecialties.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER
    );
  });

  it('should not backfill specialties when every older master family identifies a legacy tenant', async () => {
    provisioningRepo.hasSeededAssetMasters.mockResolvedValue(true);
    provisioningRepo.hasSeededWorkOrderMasters.mockResolvedValue(true);
    provisioningRepo.hasSeededAppointmentMasters.mockResolvedValue(true);

    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({ success: true, data: onboardedTenant });
    expect(permissionRepo.seedPermissionCatalogue).toHaveBeenCalledTimes(1);
    expect(seedSystemRoles).not.toHaveBeenCalled();
    expect(seedSpecialties).not.toHaveBeenCalled();
    expect(seedAppointmentMasters).not.toHaveBeenCalled();
    expect(seedAssetMasters).not.toHaveBeenCalled();
    expect(seedWorkOrderMasters).not.toHaveBeenCalled();
    expect(tenantRepo.markTenantOnboarded).toHaveBeenCalledWith('org-1');
  });

  it('should seed specialties when an older master family is missing during a partial onboarding', async () => {
    provisioningRepo.hasSeededAssetMasters.mockResolvedValue(true);
    provisioningRepo.hasSeededAppointmentMasters.mockResolvedValue(true);

    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({ success: true, data: onboardedTenant });
    expect(seedSpecialties).toHaveBeenCalledWith('org-1');
    expect(seedAppointmentMasters).not.toHaveBeenCalled();
    expect(seedAssetMasters).not.toHaveBeenCalled();
    expect(seedWorkOrderMasters).toHaveBeenCalledWith('org-1');
  });

  it('should seed only the missing master families when a previous attempt partially seeded', async () => {
    provisioningRepo.hasSeededAssetMasters.mockResolvedValue(true);
    provisioningRepo.hasSeededAppointmentMasters.mockResolvedValue(true);
    provisioningRepo.hasSeededSpecialties.mockResolvedValue(true);

    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({ success: true, data: onboardedTenant });
    expect(seedAppointmentMasters).not.toHaveBeenCalled();
    expect(seedAssetMasters).not.toHaveBeenCalled();
    expect(seedSpecialties).not.toHaveBeenCalled();
    expect(seedWorkOrderMasters).toHaveBeenCalledWith('org-1');
    expect(tenantRepo.markTenantOnboarded).toHaveBeenCalledWith('org-1');
  });

  it('should stop seeding and not mark onboarded when a seed command fails', async () => {
    seedAssetMasters.mockResolvedValue({ success: false, errors: ['Asset seeding failed'] });

    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({
      success: false,
      errors: ['Asset seeding failed'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
    expect(seedWorkOrderMasters).not.toHaveBeenCalled();
    expect(tenantRepo.markTenantOnboarded).not.toHaveBeenCalled();
  });

  it('should stop before default masters when System Role seeding fails', async () => {
    seedSystemRoles.mockResolvedValue({ success: false, errors: ['System Role seeding failed'] });

    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({
      success: false,
      errors: ['System Role seeding failed'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
    expect(seedSpecialties).not.toHaveBeenCalled();
    expect(seedAppointmentMasters).not.toHaveBeenCalled();
    expect(seedAssetMasters).not.toHaveBeenCalled();
    expect(seedWorkOrderMasters).not.toHaveBeenCalled();
    expect(tenantRepo.markTenantOnboarded).not.toHaveBeenCalled();
  });

  it('should stop before older master families when specialty seeding fails', async () => {
    seedSpecialties.mockResolvedValue({
      success: false,
      errors: ['Specialty seeding failed'],
    });

    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({
      success: false,
      errors: ['Specialty seeding failed'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
    expect(seedAppointmentMasters).not.toHaveBeenCalled();
    expect(seedAssetMasters).not.toHaveBeenCalled();
    expect(seedWorkOrderMasters).not.toHaveBeenCalled();
    expect(tenantRepo.markTenantOnboarded).not.toHaveBeenCalled();
  });

  it('should return a clean failure when marking the tenant onboarded returns undefined', async () => {
    tenantRepo.markTenantOnboarded.mockResolvedValue(undefined);

    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({
      success: false,
      errors: ['Tenant onboarding failed.'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('should return a clean failure when seeding throws', async () => {
    permissionRepo.seedPermissionCatalogue.mockRejectedValue(new Error('boom'));

    const result = await onboardTenantCommand('org-1');

    expect(result).toEqual({
      success: false,
      errors: ['Tenant onboarding failed.'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
    expect(tenantRepo.markTenantOnboarded).not.toHaveBeenCalled();
  });
});
