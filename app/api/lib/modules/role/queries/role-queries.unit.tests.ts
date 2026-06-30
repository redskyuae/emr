import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roleRepository } from '../repository/role-repository';
import { validateGetRoleById } from '../validator/get-role-by-id-validator';
import { getRoleByIdQuery } from './get-role-by-id-query';
import { getRolesQuery } from './get-roles-query';

vi.mock('../repository/role-repository', () => ({
  roleRepository: {
    getRoleByIdWithStats: vi.fn(),
    getRoles: vi.fn(),
  },
}));
vi.mock('../validator/get-role-by-id-validator', () => ({ validateGetRoleById: vi.fn() }));

const repo = vi.mocked(roleRepository);
const validateById = vi.mocked(validateGetRoleById);
const role = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Manager',
  code: 'MANAGER',
  isSystem: false,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};
const roleWithStats = { ...role, assignedStaffCount: 2, permissionAssignmentCount: 3 };

describe('Role queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockResolvedValue({ success: true, data: role });
    repo.getRoleByIdWithStats.mockResolvedValue(roleWithStats);
    repo.getRoles.mockResolvedValue({ data: [roleWithStats], total: 1 });
  });

  it('should return validation failure and not call repository when id validation fails', async () => {
    validateById.mockResolvedValue({ success: false, errors: ['Role abc is Invalid.'] });
    const result = await getRoleByIdQuery('abc', 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Role abc is Invalid.'] });
    expect(repo.getRoleByIdWithStats).not.toHaveBeenCalled();
  });

  it('should return the role with stats on success', async () => {
    await expect(getRoleByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: roleWithStats,
    });
    expect(repo.getRoleByIdWithStats).toHaveBeenCalledWith(1, 'tenant-1');
  });

  it('should return not found when the stats lookup returns nothing', async () => {
    repo.getRoleByIdWithStats.mockResolvedValue(undefined);
    const result = await getRoleByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return list data and total for the list query', async () => {
    await expect(
      getRolesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'man' })
    ).resolves.toEqual({
      success: true,
      data: [roleWithStats],
      total: 1,
    });
    expect(repo.getRoles).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'man',
    });
  });
});
