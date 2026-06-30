import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { userRoleRepository } from '../repository/user-role-repository';
import { validateAssignRoles } from '../validator/assign-roles-validator';
import { validateRemoveRole } from '../validator/remove-role-validator';
import { assignRolesCommand } from './assign-roles-command';
import { removeRoleCommand } from './remove-role-command';

vi.mock('../repository/user-role-repository', () => ({
  userRoleRepository: { assignRoles: vi.fn(), removeRole: vi.fn() },
}));
vi.mock('../validator/assign-roles-validator', () => ({ validateAssignRoles: vi.fn() }));
vi.mock('../validator/remove-role-validator', () => ({ validateRemoveRole: vi.fn() }));

const repo = vi.mocked(userRoleRepository);
const validateAssign = vi.mocked(validateAssignRoles);
const validateRemove = vi.mocked(validateRemoveRole);
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
const assignment = {
  id: 5,
  userId: 'user-1',
  roleId: 1,
  tenantId: 'tenant-1',
  assignedBy: 'admin',
  createdOn: new Date(),
  assignedOn: new Date(),
};

describe('UserRole commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateAssign.mockResolvedValue({
      success: true,
      data: {
        userId: 'user-1',
        tenantId: 'tenant-1',
        assignedBy: 'admin',
        payload: { roleIds: [1] },
      },
    });
    validateRemove.mockResolvedValue({
      success: true,
      data: { userId: 'user-1', roleId: 1, tenantId: 'tenant-1' },
    });
    repo.assignRoles.mockResolvedValue([role]);
    repo.removeRole.mockResolvedValue(assignment);
  });

  it('should return validation failure and not write when assign validation fails', async () => {
    validateAssign.mockResolvedValue({ success: false, errors: ['Invalid'], status: 404 });
    const result = await assignRolesCommand('user-1', 'tenant-1', 'admin', {});
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 404 });
    expect(repo.assignRoles).not.toHaveBeenCalled();
  });

  it('should assign roles on success', async () => {
    await expect(assignRolesCommand('user-1', 'tenant-1', 'admin', {})).resolves.toEqual({
      success: true,
      data: [role],
    });
    expect(repo.assignRoles).toHaveBeenCalledWith('user-1', 'tenant-1', [1], 'admin');
  });

  it('should remove a role on success', async () => {
    await expect(removeRoleCommand('user-1', '1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: assignment,
    });
    expect(repo.removeRole).toHaveBeenCalledWith('user-1', 1, 'tenant-1');
  });

  it('should return not found when removing an assignment that no longer exists', async () => {
    repo.removeRole.mockResolvedValue(undefined);
    await expect(removeRoleCommand('user-1', '1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
