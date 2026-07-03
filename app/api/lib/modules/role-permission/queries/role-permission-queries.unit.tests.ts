import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rolePermissionRepository } from '../repository/role-permission-repository';
import { validateRolePermissionRole } from '../validator/role-permission-validator-utils';
import { getRolePermissionsQuery } from './get-role-permissions-query';

vi.mock('../repository/role-permission-repository', () => ({
  rolePermissionRepository: { getAssignedPermissionsByRole: vi.fn() },
}));
vi.mock('../validator/role-permission-validator-utils', () => ({
  validateRolePermissionRole: vi.fn(),
}));

const repo = vi.mocked(rolePermissionRepository);
const validateRole = vi.mocked(validateRolePermissionRole);
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
const assignedPermission = {
  id: 10,
  name: 'roles.read',
  action: 'read',
  module: 'identity-access',
  resource: 'roles',
  description: null,
};

describe('RolePermission queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateRole.mockResolvedValue({
      success: true,
      data: { roleId: 1, tenantId: 'tenant-1', role },
    });
    repo.getAssignedPermissionsByRole.mockResolvedValue([assignedPermission]);
  });

  it('should return validation failure and not call repository when the role is invalid', async () => {
    validateRole.mockResolvedValue({ success: false, errors: ['Role not found'], status: 404 });
    const result = await getRolePermissionsQuery('1', 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Role not found'], status: 404 });
    expect(repo.getAssignedPermissionsByRole).not.toHaveBeenCalled();
  });

  it('should return the assigned permissions on success', async () => {
    await expect(getRolePermissionsQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: [assignedPermission],
    });
    expect(repo.getAssignedPermissionsByRole).toHaveBeenCalledWith(1, 'tenant-1');
  });

  it('should propagate the not-found status from the role validator', async () => {
    validateRole.mockResolvedValue({
      success: false,
      errors: ['Role not found'],
      status: StatusCodes.NOT_FOUND,
    });
    const result = await getRolePermissionsQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });
});
