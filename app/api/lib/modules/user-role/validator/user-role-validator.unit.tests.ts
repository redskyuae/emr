import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { roleRepository } from '../../role/repository/role-repository';
import { staffRepository } from '../../staff/repository/staff-repository';
import { userRoleRepository } from '../repository/user-role-repository';
import { validateAssignRoles } from './assign-roles-validator';
import { validateRemoveRole } from './remove-role-validator';
import { validateActiveRoles, validateActiveStaff } from './user-role-validator-utils';

vi.mock('../../role/repository/role-repository', () => ({
  roleRepository: { getRoleById: vi.fn(), getRolesByIds: vi.fn() },
}));
vi.mock('../../staff/repository/staff-repository', () => ({
  staffRepository: { getStaffByUserId: vi.fn() },
}));
vi.mock('../repository/user-role-repository', () => ({
  userRoleRepository: { getRoleAssignment: vi.fn(), countAssignmentsByUser: vi.fn() },
}));

const roleRepo = vi.mocked(roleRepository);
const staffRepo = vi.mocked(staffRepository);
const repo = vi.mocked(userRoleRepository);
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
const staff = { id: 'user-1', isActive: true } as never;
const assignment = {
  id: 5,
  userId: 'user-1',
  roleId: 1,
  tenantId: 'tenant-1',
  assignedBy: 'admin',
  createdOn: new Date(),
  assignedOn: new Date(),
};

describe('UserRole validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    staffRepo.getStaffByUserId.mockResolvedValue(staff);
    roleRepo.getRoleById.mockResolvedValue(role);
    roleRepo.getRolesByIds.mockResolvedValue([role]);
    repo.getRoleAssignment.mockResolvedValue(assignment);
    repo.countAssignmentsByUser.mockResolvedValue(2);
  });

  it('should return not found when the staff member is missing or inactive', async () => {
    staffRepo.getStaffByUserId.mockResolvedValue({ id: 'user-1', isActive: false } as never);
    const result = await validateActiveStaff('user-1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return active staff params on success', async () => {
    await expect(validateActiveStaff('user-1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: { userId: 'user-1', tenantId: 'tenant-1' },
    });
  });

  it('should flag missing role ids', async () => {
    roleRepo.getRolesByIds.mockResolvedValue([role]);
    const result = await validateActiveRoles([1, 2], 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Role not found: 2.'],
    });
  });

  it('should reject an empty assign payload', async () => {
    const result = await validateAssignRoles('user-1', 'tenant-1', 'admin', { roleIds: [] });
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['At least one Role ID is required']),
    });
  });

  it('should deduplicate role ids and return params on assign success', async () => {
    const result = await validateAssignRoles('user-1', 'tenant-1', 'admin', { roleIds: [1, 1] });
    expect(result).toEqual({
      success: true,
      data: {
        userId: 'user-1',
        tenantId: 'tenant-1',
        assignedBy: 'admin',
        payload: { roleIds: [1] },
      },
    });
  });

  it('should return role not found on remove when the role is missing', async () => {
    roleRepo.getRoleById.mockResolvedValue(undefined);
    const result = await validateRemoveRole('user-1', '1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return assignment not found on remove when there is no assignment', async () => {
    repo.getRoleAssignment.mockResolvedValue(undefined);
    const result = await validateRemoveRole('user-1', '1', 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Role Assignment not found'],
    });
  });

  it('should prevent removing the last role of a user', async () => {
    repo.countAssignmentsByUser.mockResolvedValue(1);
    const result = await validateRemoveRole('user-1', '1', 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      errors: ['Users must have at least one role.'],
    });
  });

  it('should return params on remove success', async () => {
    const result = await validateRemoveRole('user-1', '1', 'tenant-1');
    expect(result).toEqual({
      success: true,
      data: { userId: 'user-1', roleId: 1, tenantId: 'tenant-1' },
    });
  });
});
