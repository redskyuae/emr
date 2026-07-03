import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roleRepository } from '../repository/role-repository';
import { userRoleRepository } from '../../user-role/repository/user-role-repository';
import { validateCreateRole } from './create-role-validator';
import { validateDeleteRole } from './delete-role-validator';
import { validateGetRoleById } from './get-role-by-id-validator';
import { validateUpdateRole } from './update-role-validator';

vi.mock('../repository/role-repository', () => ({
  roleRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getRoleById: vi.fn(),
  },
}));
vi.mock('../../user-role/repository/user-role-repository', () => ({
  userRoleRepository: {
    countAssignmentsByRole: vi.fn(),
  },
}));

const repo = vi.mocked(roleRepository);
const userRoleRepo = vi.mocked(userRoleRepository);
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

describe('Role validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getRoleById.mockResolvedValue(role);
    userRoleRepo.countAssignmentsByRole.mockResolvedValue(0);
  });

  it('should return schema errors and skip uniqueness when create payload is invalid', async () => {
    const result = await validateCreateRole({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Role name is required']),
    });
    expect(repo.findActiveByName).not.toHaveBeenCalled();
  });

  it('should return conflict when create name already exists', async () => {
    repo.findActiveByName.mockResolvedValue(role);
    const result = await validateCreateRole({ name: 'Manager', code: 'MGR' }, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Role name Manager already exists.'],
    });
  });

  it('should return parsed payload and tenant on create success', async () => {
    const result = await validateCreateRole({ name: 'Manager', code: 'mgr' }, 'tenant-1');
    expect(result).toMatchObject({
      success: true,
      data: { payload: { name: 'Manager', code: 'MGR' }, tenantId: 'tenant-1' },
    });
  });

  it('should reject changing the code on update', async () => {
    const result = await validateUpdateRole('1', 'tenant-1', { name: 'Manager', code: 'MGR' });
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Role code cannot be changed.']),
    });
  });

  it('should return invalid id error on update', async () => {
    const result = await validateUpdateRole('abc', 'tenant-1', { name: 'Manager' });
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Role abc is Invalid.']),
    });
  });

  it('should return not found on update when the role does not exist', async () => {
    repo.getRoleById.mockResolvedValue(undefined);
    const result = await validateUpdateRole('1', 'tenant-1', { name: 'Manager' });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should pass exclude id to the name uniqueness check on update', async () => {
    await validateUpdateRole('7', 'tenant-1', { name: 'Manager' });
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Manager', { excludeId: 7 });
  });

  it('should return parsed id/payload/tenant on update success', async () => {
    const result = await validateUpdateRole('7', 'tenant-1', { name: 'Manager' });
    expect(result).toEqual({
      success: true,
      data: { id: 7, tenantId: 'tenant-1', payload: { name: 'Manager' } },
    });
  });

  it('should reject deleting a system role', async () => {
    repo.getRoleById.mockResolvedValue({ ...role, isSystem: true });
    const result = await validateDeleteRole('1', 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: ['System roles cannot be deleted.'],
    });
  });

  it('should reject deleting a role with active assignments', async () => {
    userRoleRepo.countAssignmentsByRole.mockResolvedValue(3);
    const result = await validateDeleteRole('1', 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: ['Role has active assignments.'],
    });
  });

  it('should return not found on delete when the role does not exist', async () => {
    repo.getRoleById.mockResolvedValue(undefined);
    const result = await validateDeleteRole('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return id/tenant on delete success', async () => {
    const result = await validateDeleteRole('1', 'tenant-1');
    expect(result).toEqual({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
  });

  it('should return the role on get-by-id success and not found otherwise', async () => {
    await expect(validateGetRoleById('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: role,
    });
    repo.getRoleById.mockResolvedValue(undefined);
    await expect(validateGetRoleById('1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
