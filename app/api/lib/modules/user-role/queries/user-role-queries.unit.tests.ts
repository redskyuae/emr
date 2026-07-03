import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { userRoleRepository } from '../repository/user-role-repository';
import { validateActiveStaff } from '../validator/user-role-validator-utils';
import { getUserRolesQuery } from './get-user-roles-query';

vi.mock('../repository/user-role-repository', () => ({
  userRoleRepository: { getAssignedRolesByUser: vi.fn() },
}));
vi.mock('../validator/user-role-validator-utils', () => ({ validateActiveStaff: vi.fn() }));

const repo = vi.mocked(userRoleRepository);
const validateStaff = vi.mocked(validateActiveStaff);
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

describe('UserRole queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateStaff.mockResolvedValue({
      success: true,
      data: { userId: 'user-1', tenantId: 'tenant-1' },
    });
    repo.getAssignedRolesByUser.mockResolvedValue([role]);
  });

  it('should return validation failure and not call repository when staff validation fails', async () => {
    validateStaff.mockResolvedValue({ success: false, errors: ['Staff not found'], status: 404 });
    const result = await getUserRolesQuery('user-1', 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Staff not found'], status: 404 });
    expect(repo.getAssignedRolesByUser).not.toHaveBeenCalled();
  });

  it('should return assigned roles and total on success', async () => {
    await expect(getUserRolesQuery('user-1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: [role],
      total: 1,
    });
    expect(repo.getAssignedRolesByUser).toHaveBeenCalledWith('user-1', 'tenant-1');
  });

  it('should propagate the not-found status from the staff validator', async () => {
    validateStaff.mockResolvedValue({
      success: false,
      errors: ['Staff not found'],
      status: StatusCodes.NOT_FOUND,
    });
    const result = await getUserRolesQuery('user-1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });
});
