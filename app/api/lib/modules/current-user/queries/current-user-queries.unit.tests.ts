import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hasTenantAdminRole } from '@/app/api/lib/utils/auth-helpers';
import { staffRepository } from '../../staff/repository/staff-repository';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { userRoleRepository } from '../../user-role/repository/user-role-repository';
import { currentUserRepository } from '../repository/current-user-repository';
import { getCurrentUserQuery } from './get-current-user-query';

vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ hasTenantAdminRole: vi.fn() }));
vi.mock('../../staff/repository/staff-repository', () => ({
  staffRepository: { getStaffByUserId: vi.fn() },
}));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { findTenantMembership: vi.fn(), getTenantById: vi.fn() },
}));
vi.mock('../../user-role/repository/user-role-repository', () => ({
  userRoleRepository: { getAssignedRolesByUser: vi.fn() },
}));
vi.mock('../repository/current-user-repository', () => ({
  currentUserRepository: {
    getAllActivePermissionKeys: vi.fn(),
    getAuthUserById: vi.fn(),
    getPermissionKeysByRoleIds: vi.fn(),
  },
}));

const currentUserRepo = vi.mocked(currentUserRepository);
const staffRepo = vi.mocked(staffRepository);
const tenantRepo = vi.mocked(tenantRepository);
const userRoleRepo = vi.mocked(userRoleRepository);
const isTenantAdmin = vi.mocked(hasTenantAdminRole);

describe('CurrentUser queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUserRepo.getAuthUserById.mockResolvedValue({
      id: 'user-1',
      name: 'Asha Rao',
      email: 'asha@example.com',
      image: null,
      phone: null,
      emailVerified: true,
    });
    tenantRepo.findTenantMembership.mockResolvedValue({
      id: 'membership-1',
      role: 'owner',
      userId: 'user-1',
      tenantId: 'tenant-1',
    });
    tenantRepo.getTenantById.mockResolvedValue({
      id: 'tenant-1',
      name: 'Dhathri',
      slug: 'dhathri',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      isActive: true,
      logo: null,
      timeZone: 'Asia/Dubai',
      isOnboarded: true,
    });
    staffRepo.getStaffByUserId.mockResolvedValue(undefined);
    userRoleRepo.getAssignedRolesByUser.mockResolvedValue([]);
    isTenantAdmin.mockReturnValue(true);
    currentUserRepo.getAllActivePermissionKeys.mockResolvedValue(['appointment:read']);
  });

  it('should expose the Tenant time zone used by operational date views', async () => {
    const result = await getCurrentUserQuery('user-1', 'tenant-1');

    expect(result).toMatchObject({
      success: true,
      data: { tenant: { id: 'tenant-1', timeZone: 'Asia/Dubai' } },
    });
  });
});
