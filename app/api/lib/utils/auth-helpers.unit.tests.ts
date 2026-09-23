import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { currentUserRepository } from '../modules/current-user/repository/current-user-repository';
import { tenantRepository } from '../modules/tenant/repository/tenant-repository';
import { userRoleRepository } from '../modules/user-role/repository/user-role-repository';
import { requireTenantPermissions, type TenantSession } from './auth-helpers';

vi.mock('../modules/current-user/repository/current-user-repository', () => ({
  currentUserRepository: {
    getAllActivePermissionKeys: vi.fn(),
    getPermissionKeysByRoleIds: vi.fn(),
  },
}));
vi.mock('../modules/tenant/repository/tenant-repository', () => ({
  tenantRepository: { findTenantMembership: vi.fn() },
}));
vi.mock('../modules/user-role/repository/user-role-repository', () => ({
  userRoleRepository: { getAssignedRolesByUser: vi.fn() },
}));

const currentUserRepo = vi.mocked(currentUserRepository);
const tenantRepo = vi.mocked(tenantRepository);
const userRoleRepo = vi.mocked(userRoleRepository);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'user-1' } },
} as TenantSession;

describe('Auth helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenantRepo.findTenantMembership.mockResolvedValue({ role: 'member' } as never);
    userRoleRepo.getAssignedRolesByUser.mockResolvedValue([{ id: 10 }, { id: 11 }] as never);
    currentUserRepo.getPermissionKeysByRoleIds.mockResolvedValue([
      'appointment:create',
      'patient-treatment-plan:read',
    ]);
    currentUserRepo.getAllActivePermissionKeys.mockResolvedValue([
      'appointment:create',
      'patient-treatment-plan:read',
      'patient-treatment-plan:assign',
    ]);
  });

  it.each(['owner', 'admin', 'member, admin'])(
    'should allow Tenant membership role %s through the active Permission Catalogue without Tenant Role lookups',
    async (role) => {
      tenantRepo.findTenantMembership.mockResolvedValue({ role } as never);

      await expect(
        requireTenantPermissions(tenantSession, ['patient-treatment-plan:read'])
      ).resolves.toBeNull();
      expect(userRoleRepo.getAssignedRolesByUser).not.toHaveBeenCalled();
      expect(currentUserRepo.getPermissionKeysByRoleIds).not.toHaveBeenCalled();
      expect(currentUserRepo.getAllActivePermissionKeys).toHaveBeenCalledOnce();
    }
  );

  it('should return forbidden to a Tenant admin when the requested permission is not active', async () => {
    tenantRepo.findTenantMembership.mockResolvedValue({ role: 'admin' } as never);
    currentUserRepo.getAllActivePermissionKeys.mockResolvedValue(['appointment:create']);

    const response = await requireTenantPermissions(tenantSession, ['patient-treatment-plan:read']);

    expect(response?.status).toBe(StatusCodes.FORBIDDEN);
    expect(userRoleRepo.getAssignedRolesByUser).not.toHaveBeenCalled();
  });

  it('should allow a Tenant member when every required permission comes from assigned Tenant Roles', async () => {
    await expect(
      requireTenantPermissions(tenantSession, ['appointment:create', 'patient-treatment-plan:read'])
    ).resolves.toBeNull();

    expect(tenantRepo.findTenantMembership).toHaveBeenCalledWith('tenant-1', 'user-1');
    expect(userRoleRepo.getAssignedRolesByUser).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(currentUserRepo.getPermissionKeysByRoleIds).toHaveBeenCalledWith([10, 11], 'tenant-1');
  });

  it('should return forbidden when the Current User is not a member of the active Tenant', async () => {
    tenantRepo.findTenantMembership.mockResolvedValue(undefined);

    const response = await requireTenantPermissions(tenantSession, ['appointment:create']);

    expect(response?.status).toBe(StatusCodes.FORBIDDEN);
    await expect(response?.json()).resolves.toEqual({ message: 'Forbidden' });
    expect(userRoleRepo.getAssignedRolesByUser).not.toHaveBeenCalled();
  });

  it('should return forbidden when any required permission is absent', async () => {
    currentUserRepo.getPermissionKeysByRoleIds.mockResolvedValue(['appointment:create']);

    const response = await requireTenantPermissions(tenantSession, [
      'appointment:create',
      'patient-treatment-plan:assign',
    ]);

    expect(response?.status).toBe(StatusCodes.FORBIDDEN);
    await expect(response?.json()).resolves.toEqual({ message: 'Forbidden' });
  });

  it('should return forbidden when the Current User has no Tenant Role assignments', async () => {
    userRoleRepo.getAssignedRolesByUser.mockResolvedValue([]);
    currentUserRepo.getPermissionKeysByRoleIds.mockResolvedValue([]);

    const response = await requireTenantPermissions(tenantSession, ['appointment:create']);

    expect(response?.status).toBe(StatusCodes.FORBIDDEN);
    expect(currentUserRepo.getPermissionKeysByRoleIds).toHaveBeenCalledWith([], 'tenant-1');
  });
});
