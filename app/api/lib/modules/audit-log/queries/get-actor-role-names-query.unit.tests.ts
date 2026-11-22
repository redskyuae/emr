import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { userRoleRepository } from '../../user-role/repository/user-role-repository';
import { getActorRoleNamesQuery } from './get-actor-role-names-query';

vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { findTenantMembership: vi.fn() },
}));
vi.mock('../../user-role/repository/user-role-repository', () => ({
  userRoleRepository: { getAssignedRolesByUser: vi.fn() },
}));

const tenants = vi.mocked(tenantRepository);
const userRoles = vi.mocked(userRoleRepository);

const role = (name: string) => ({ name }) as never;

describe('getActorRoleNamesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenants.findTenantMembership.mockResolvedValue({ role: 'member' } as never);
    userRoles.getAssignedRolesByUser.mockResolvedValue([]);
  });

  it('should list the ownership label first, then assigned Roles without repeats', async () => {
    tenants.findTenantMembership.mockResolvedValue({ role: 'owner' } as never);
    userRoles.getAssignedRolesByUser.mockResolvedValue([
      role('Tenant Owner'),
      role('Doctor'),
      role('Billing Clerk'),
    ]);

    await expect(getActorRoleNamesQuery('user-1', 'tenant-1')).resolves.toBe(
      'Tenant Owner, Doctor, Billing Clerk'
    );
    expect(userRoles.getAssignedRolesByUser).toHaveBeenCalledWith('user-1', 'tenant-1');
  });

  it('should leave plain membership out and return null when the user holds no Role', async () => {
    await expect(getActorRoleNamesQuery('user-1', 'tenant-1')).resolves.toBeNull();
  });

  it('should cope with a user who is no longer a member', async () => {
    tenants.findTenantMembership.mockResolvedValue(undefined);
    userRoles.getAssignedRolesByUser.mockResolvedValue([role('Nurse')]);

    await expect(getActorRoleNamesQuery('user-1', 'tenant-1')).resolves.toBe('Nurse');
  });
});
