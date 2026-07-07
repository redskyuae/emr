import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rolePermissionRepository } from '../../role-permission/repository/role-permission-repository';
import { roleRepository } from '../repository/role-repository';
import { validateCreateRole } from '../validator/create-role-validator';
import { validateDeleteRole } from '../validator/delete-role-validator';
import { validateUpdateRole } from '../validator/update-role-validator';
import { createRoleCommand } from './create-role-command';
import { deleteRoleCommand } from './delete-role-command';
import { seedSystemRolesCommand } from './seed-system-roles-command';
import { updateRoleCommand } from './update-role-command';

vi.mock('../repository/role-repository', () => ({
  roleRepository: {
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    getRoleByIdWithStats: vi.fn(),
    seedSystemRolesForTenant: vi.fn(),
  },
}));
vi.mock('../../role-permission/repository/role-permission-repository', () => ({
  rolePermissionRepository: { seedDefaultPermissionsForSystemRoles: vi.fn() },
}));
vi.mock('../validator/create-role-validator', () => ({ validateCreateRole: vi.fn() }));
vi.mock('../validator/update-role-validator', () => ({ validateUpdateRole: vi.fn() }));
vi.mock('../validator/delete-role-validator', () => ({ validateDeleteRole: vi.fn() }));

const repo = vi.mocked(roleRepository);
const rolePermissionRepo = vi.mocked(rolePermissionRepository);
const validateCreate = vi.mocked(validateCreateRole);
const validateUpdate = vi.mocked(validateUpdateRole);
const validateDelete = vi.mocked(validateDeleteRole);
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

describe('Role commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: {
        payload: { name: 'Manager', code: 'MANAGER', description: undefined },
        tenantId: 'tenant-1',
      },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, tenantId: 'tenant-1', payload: { name: 'Manager' } },
    });
    validateDelete.mockResolvedValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.createRole.mockResolvedValue(role);
    repo.updateRole.mockResolvedValue(role);
    repo.deleteRole.mockResolvedValue(role);
    repo.getRoleByIdWithStats.mockResolvedValue(roleWithStats);
    repo.seedSystemRolesForTenant.mockResolvedValue([role]);
    rolePermissionRepo.seedDefaultPermissionsForSystemRoles.mockResolvedValue(undefined);
  });

  it('should return validation failure and not write when create validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createRoleCommand({}, 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(repo.createRole).not.toHaveBeenCalled();
  });

  it('should create the role and return it with stats', async () => {
    const result = await createRoleCommand({}, 'tenant-1');
    expect(repo.createRole).toHaveBeenCalledWith('tenant-1', {
      name: 'Manager',
      code: 'MANAGER',
      description: undefined,
    });
    expect(result).toEqual({ success: true, data: roleWithStats });
  });

  it('should fall back to zero stats when the stats lookup returns nothing on create', async () => {
    repo.getRoleByIdWithStats.mockResolvedValue(undefined);
    const result = await createRoleCommand({}, 'tenant-1');
    expect(result).toEqual({
      success: true,
      data: { ...role, assignedStaffCount: 0, permissionAssignmentCount: 0 },
    });
  });

  it('should map a unique constraint 23505 on create to a conflict error', async () => {
    repo.createRole.mockRejectedValue({ code: '23505', constraint: 'role_tenant_name_idx' });
    await expect(createRoleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Role name Manager already exists.'],
    });
  });

  it('should rethrow unknown create errors', async () => {
    const error = new Error('database down');
    repo.createRole.mockRejectedValue(error);
    await expect(createRoleCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should map a reserved Role code collision to a conflict error when seeding System Roles', async () => {
    repo.seedSystemRolesForTenant.mockRejectedValue(
      new Error('System Role seeding failed because a reserved Role code is unavailable.')
    );

    await expect(seedSystemRolesCommand('tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['System Role seeding failed because a reserved Role code is unavailable.'],
    });
    expect(rolePermissionRepo.seedDefaultPermissionsForSystemRoles).not.toHaveBeenCalled();
  });

  it('should update the role and return it with stats', async () => {
    await expect(updateRoleCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: roleWithStats,
    });
  });

  it('should return not found when update repository reports no row', async () => {
    repo.updateRole.mockResolvedValue(undefined);
    await expect(updateRoleCommand('1', 'tenant-1', {})).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should map a unique constraint 23505 on update to a conflict error', async () => {
    repo.updateRole.mockRejectedValue({ code: '23505', constraint: 'role_tenant_name_idx' });
    await expect(updateRoleCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Role name Manager already exists.'],
    });
  });

  it('should delete the role and return it', async () => {
    await expect(deleteRoleCommand('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: role,
    });
  });

  it('should return not found when delete repository reports no row', async () => {
    repo.deleteRole.mockResolvedValue(undefined);
    await expect(deleteRoleCommand('1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
