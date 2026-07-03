import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rolePermissionRepository } from '../repository/role-permission-repository';
import { validateAssignPermissions } from '../validator/assign-permissions-validator';
import { validateRemovePermission } from '../validator/remove-permission-validator';
import { validateSetPermissions } from '../validator/set-permissions-validator';
import { assignPermissionsCommand } from './assign-permissions-command';
import { removePermissionCommand } from './remove-permission-command';
import { setPermissionsCommand } from './set-permissions-command';

vi.mock('../repository/role-permission-repository', () => ({
  rolePermissionRepository: {
    assignPermissions: vi.fn(),
    setPermissions: vi.fn(),
    removePermission: vi.fn(),
  },
}));
vi.mock('../validator/assign-permissions-validator', () => ({
  validateAssignPermissions: vi.fn(),
}));
vi.mock('../validator/remove-permission-validator', () => ({ validateRemovePermission: vi.fn() }));
vi.mock('../validator/set-permissions-validator', () => ({ validateSetPermissions: vi.fn() }));

const repo = vi.mocked(rolePermissionRepository);
const validateAssign = vi.mocked(validateAssignPermissions);
const validateRemove = vi.mocked(validateRemovePermission);
const validateSet = vi.mocked(validateSetPermissions);
const assignedPermission = {
  id: 10,
  name: 'roles.read',
  action: 'read',
  module: 'identity-access',
  resource: 'roles',
  description: null,
};
const assignment = {
  id: 5,
  roleId: 1,
  permissionId: 10,
  tenantId: 'tenant-1',
  createdOn: new Date(),
};

describe('RolePermission commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateAssign.mockResolvedValue({
      success: true,
      data: { roleId: 1, tenantId: 'tenant-1', payload: { permissionIds: [10] } },
    });
    validateSet.mockResolvedValue({
      success: true,
      data: { roleId: 1, tenantId: 'tenant-1', payload: { permissionIds: [10] } },
    });
    validateRemove.mockResolvedValue({
      success: true,
      data: { roleId: 1, permissionId: 10, tenantId: 'tenant-1' },
    });
    repo.assignPermissions.mockResolvedValue([assignedPermission]);
    repo.setPermissions.mockResolvedValue([assignedPermission]);
    repo.removePermission.mockResolvedValue(assignment);
  });

  it('should return validation failure and not write when assign validation fails', async () => {
    validateAssign.mockResolvedValue({ success: false, errors: ['Invalid'], status: 400 });
    const result = await assignPermissionsCommand('1', 'tenant-1', {});
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 400 });
    expect(repo.assignPermissions).not.toHaveBeenCalled();
  });

  it('should assign permissions on success', async () => {
    await expect(assignPermissionsCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: [assignedPermission],
    });
    expect(repo.assignPermissions).toHaveBeenCalledWith(1, 'tenant-1', [10]);
  });

  it('should set permissions on success', async () => {
    await expect(setPermissionsCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: [assignedPermission],
    });
    expect(repo.setPermissions).toHaveBeenCalledWith(1, 'tenant-1', [10]);
  });

  it('should remove a permission on success', async () => {
    await expect(removePermissionCommand('1', '10', 'tenant-1')).resolves.toEqual({
      success: true,
      data: assignment,
    });
    expect(repo.removePermission).toHaveBeenCalledWith(1, 10, 'tenant-1');
  });

  it('should return not found when removing an assignment that no longer exists', async () => {
    repo.removePermission.mockResolvedValue(undefined);
    await expect(removePermissionCommand('1', '10', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
