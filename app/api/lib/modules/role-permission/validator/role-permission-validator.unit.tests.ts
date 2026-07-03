import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roleRepository } from '../../role/repository/role-repository';
import { rolePermissionRepository } from '../repository/role-permission-repository';
import { validateAssignPermissions } from './assign-permissions-validator';
import { validateRemovePermission } from './remove-permission-validator';
import { validateSetPermissions } from './set-permissions-validator';
import {
  validateActivePermissions,
  validateRolePermissionRole,
} from './role-permission-validator-utils';

vi.mock('../../role/repository/role-repository', () => ({
  roleRepository: { getRoleById: vi.fn() },
}));
vi.mock('../repository/role-permission-repository', () => ({
  rolePermissionRepository: {
    getActivePermissionsByIds: vi.fn(),
    getPermissionAssignment: vi.fn(),
  },
}));

const roleRepo = vi.mocked(roleRepository);
const repo = vi.mocked(rolePermissionRepository);
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
  roleId: 1,
  permissionId: 10,
  tenantId: 'tenant-1',
  createdOn: new Date(),
};

describe('RolePermission validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roleRepo.getRoleById.mockResolvedValue(role);
    repo.getActivePermissionsByIds.mockResolvedValue([{ id: 10 }, { id: 11 }] as never);
    repo.getPermissionAssignment.mockResolvedValue(assignment);
  });

  it('should return not found when the role does not exist', async () => {
    roleRepo.getRoleById.mockResolvedValue(undefined);
    const result = await validateRolePermissionRole('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return the role on success', async () => {
    await expect(validateRolePermissionRole('1', 'tenant-1')).resolves.toMatchObject({
      success: true,
      data: { roleId: 1, tenantId: 'tenant-1', role },
    });
  });

  it('should flag inactive permission ids', async () => {
    repo.getActivePermissionsByIds.mockResolvedValue([{ id: 10 }] as never);
    const result = await validateActivePermissions([10, 11]);
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      errors: ['Permission IDs are invalid: 11.'],
    });
  });

  it('should reject an empty assign payload', async () => {
    const result = await validateAssignPermissions('1', 'tenant-1', { permissionIds: [] });
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['At least one Permission ID is required']),
    });
  });

  it('should deduplicate ids and return params on assign success', async () => {
    const result = await validateAssignPermissions('1', 'tenant-1', {
      permissionIds: [10, 10, 11],
    });
    expect(result).toEqual({
      success: true,
      data: { roleId: 1, tenantId: 'tenant-1', payload: { permissionIds: [10, 11] } },
    });
  });

  it('should accept an empty set payload', async () => {
    repo.getActivePermissionsByIds.mockResolvedValue([] as never);
    const result = await validateSetPermissions('1', 'tenant-1', { permissionIds: [] });
    expect(result).toMatchObject({
      success: true,
      data: { roleId: 1, tenantId: 'tenant-1', payload: { permissionIds: [] } },
    });
  });

  it('should return invalid permission id error on remove', async () => {
    const result = await validateRemovePermission('1', 'abc', 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Permission abc is Invalid.']),
    });
  });

  it('should return not found when the assignment is missing on remove', async () => {
    repo.getPermissionAssignment.mockResolvedValue(undefined);
    const result = await validateRemovePermission('1', '10', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return params on remove success', async () => {
    const result = await validateRemovePermission('1', '10', 'tenant-1');
    expect(result).toEqual({
      success: true,
      data: { roleId: 1, permissionId: 10, tenantId: 'tenant-1' },
    });
  });
});
