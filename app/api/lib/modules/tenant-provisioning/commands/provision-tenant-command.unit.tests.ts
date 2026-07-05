import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from '@/app/lib/auth';
import { createCookieHeader, getSetCookies } from '@/app/api/lib/utils/auth-cookie-helpers';
import { permissionRepository } from '../../permission/repository/permission-repository';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { tenantProvisioningRepository } from '../repository/tenant-provisioning-repository';
import { validateTenantProvisioning } from '../validator/tenant-provisioning-validator';
import { provisionTenantCommand } from './provision-tenant-command';
import { seedDefaultAssetMastersCommand } from './seed-default-asset-masters-command';
import { seedDefaultWorkOrderMastersCommand } from './seed-default-work-order-masters-command';
import { seedDefaultAppointmentMastersCommand } from './seed-default-appointment-masters-command';

vi.mock('@/app/lib/auth', () => ({
  auth: {
    api: {
      createUser: vi.fn(),
      signInEmail: vi.fn(),
      createOrganization: vi.fn(),
      setActiveOrganization: vi.fn(),
    },
  },
}));

vi.mock('@/app/api/lib/utils/auth-cookie-helpers', () => ({
  getSetCookies: vi.fn(),
  createCookieHeader: vi.fn(),
}));

vi.mock('../validator/tenant-provisioning-validator', () => ({
  validateTenantProvisioning: vi.fn(),
}));

vi.mock('../../permission/repository/permission-repository', () => ({
  permissionRepository: {
    seedPermissionCatalogue: vi.fn(),
  },
}));

vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: {
    getTenantById: vi.fn(),
  },
}));

vi.mock('../repository/tenant-provisioning-repository', () => ({
  tenantProvisioningRepository: {
    deleteAuthUser: vi.fn(),
    findUserByEmail: vi.fn(),
    deleteTenantArtifacts: vi.fn(),
  },
}));

vi.mock('./seed-default-appointment-masters-command', () => ({
  seedDefaultAppointmentMastersCommand: vi.fn(),
}));

vi.mock('./seed-default-asset-masters-command', () => ({
  seedDefaultAssetMastersCommand: vi.fn(),
}));

vi.mock('./seed-default-work-order-masters-command', () => ({
  seedDefaultWorkOrderMastersCommand: vi.fn(),
}));

const api = vi.mocked(auth.api);
const validate = vi.mocked(validateTenantProvisioning);
const permissionRepo = vi.mocked(permissionRepository);
const tenantRepo = vi.mocked(tenantRepository);
const provisioningRepo = vi.mocked(tenantProvisioningRepository);
const mockedGetSetCookies = vi.mocked(getSetCookies);
const mockedCreateCookieHeader = vi.mocked(createCookieHeader);
const seedAppointmentMasters = vi.mocked(seedDefaultAppointmentMastersCommand);
const seedAssetMasters = vi.mocked(seedDefaultAssetMastersCommand);
const seedWorkOrderMasters = vi.mocked(seedDefaultWorkOrderMastersCommand);

const validatedInput = {
  password: 'StrongerPass123',
  ownerName: 'Dr. Priya Raghavan',
  tenantName: 'Apollo Hospitals',
  ownerEmail: 'priya@apollo.example',
  tenantSlug: 'apollo-hospitals',
};

const tenant = {
  id: 'org-1',
  name: 'Apollo Hospitals',
  slug: 'apollo-hospitals',
  createdAt: new Date(),
  isActive: true,
  logo: null,
  isOnboarded: false,
};

describe('ProvisionTenant command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockResolvedValue({ success: true, data: validatedInput });
    api.createUser.mockResolvedValue({ user: { id: 'user-1' } } as never);
    api.createOrganization.mockResolvedValue({ id: 'org-1' } as never);
    api.signInEmail.mockResolvedValue({ headers: new Headers() } as never);
    api.setActiveOrganization.mockResolvedValue({ headers: new Headers() } as never);
    tenantRepo.getTenantById.mockResolvedValue(tenant);
    mockedGetSetCookies
      .mockReturnValueOnce(['session=abc'])
      .mockReturnValueOnce(['active-org=org-1']);
    mockedCreateCookieHeader.mockReturnValue('session=abc');
  });

  it('should return validation failure and not call auth APIs when the validator fails', async () => {
    validate.mockResolvedValue({
      success: false,
      errors: ['A user with this email already exists.'],
      status: StatusCodes.CONFLICT,
    });

    const result = await provisionTenantCommand({});

    expect(result).toEqual({
      success: false,
      errors: ['A user with this email already exists.'],
      status: StatusCodes.CONFLICT,
    });
    expect(api.createUser).not.toHaveBeenCalled();
    expect(api.createOrganization).not.toHaveBeenCalled();
  });

  it('should provision the tenant and session without seeding any defaults', async () => {
    const result = await provisionTenantCommand({});

    expect(result).toEqual({
      success: true,
      data: {
        tenant,
        setCookies: ['session=abc', 'active-org=org-1'],
      },
    });
    expect(api.createUser).toHaveBeenCalledTimes(1);
    expect(api.createOrganization).toHaveBeenCalledTimes(1);
    expect(api.signInEmail).toHaveBeenCalledTimes(1);
    expect(api.setActiveOrganization).toHaveBeenCalledTimes(1);

    expect(permissionRepo.seedPermissionCatalogue).not.toHaveBeenCalled();
    expect(seedAppointmentMasters).not.toHaveBeenCalled();
    expect(seedAssetMasters).not.toHaveBeenCalled();
    expect(seedWorkOrderMasters).not.toHaveBeenCalled();
  });

  it('should clean up the created user and tenant when the tenant cannot be read back', async () => {
    tenantRepo.getTenantById.mockResolvedValue(undefined);

    const result = await provisionTenantCommand({});

    expect(result).toEqual({
      success: false,
      errors: ['Tenant provisioning failed.'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
    expect(provisioningRepo.deleteTenantArtifacts).toHaveBeenCalledWith('org-1');
    expect(provisioningRepo.deleteAuthUser).toHaveBeenCalledWith('user-1');
  });

  it('should clean up and map a duplicate email failure from auth user creation', async () => {
    api.createUser.mockRejectedValue({ body: { code: 'USER_ALREADY_EXISTS' } });

    const result = await provisionTenantCommand({});

    expect(result).toEqual({
      success: false,
      errors: ['A user with this email already exists.'],
      status: StatusCodes.CONFLICT,
    });
    expect(provisioningRepo.deleteTenantArtifacts).not.toHaveBeenCalled();
    expect(provisioningRepo.deleteAuthUser).not.toHaveBeenCalled();
  });

  it('should clean up and fail when the session cookie is not created', async () => {
    mockedCreateCookieHeader.mockReturnValue('');

    const result = await provisionTenantCommand({});

    expect(result).toEqual({
      success: false,
      errors: ['Tenant provisioning failed.'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
    expect(provisioningRepo.deleteTenantArtifacts).toHaveBeenCalledWith('org-1');
    expect(provisioningRepo.deleteAuthUser).toHaveBeenCalledWith('user-1');
  });
});
