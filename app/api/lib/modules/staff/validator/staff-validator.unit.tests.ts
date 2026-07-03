import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { staffRepository } from '../repository/staff-repository';
import { validateStaffUniqueness } from './staff-uniqueness-validator';
import {
  uniqueRoleIds,
  validateActiveRoles,
} from '../../user-role/validator/user-role-validator-utils';
import { validateCreateStaff } from './create-staff-validator';
import { validateGetStaffById } from './get-staff-by-id-validator';
import { validateUpdateStaff } from './update-staff-validator';

vi.mock('../repository/staff-repository', () => ({
  staffRepository: { getStaffByUserId: vi.fn() },
}));
vi.mock('./staff-uniqueness-validator', () => ({ validateStaffUniqueness: vi.fn() }));
vi.mock('../../user-role/validator/user-role-validator-utils', () => ({
  uniqueRoleIds: vi.fn(),
  validateActiveRoles: vi.fn(),
}));

const repo = vi.mocked(staffRepository);
const uniqueness = vi.mocked(validateStaffUniqueness);
const uniqueIds = vi.mocked(uniqueRoleIds);
const activeRoles = vi.mocked(validateActiveRoles);
const staff = {
  id: 'user-1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  isActive: true,
  phone: null,
  staffCode: null,
  designation: null,
  gender: null,
  dateOfBirth: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};
const validCreate = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  password: 'supersecret',
  roleIds: [1],
};

describe('Staff validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uniqueness.mockResolvedValue({ success: true, data: undefined });
    uniqueIds.mockReturnValue([1]);
    activeRoles.mockResolvedValue({ success: true, data: [{ id: 1 }] as never });
    repo.getStaffByUserId.mockResolvedValue(staff);
  });

  it('should return schema errors and skip uniqueness when create payload is invalid', async () => {
    const result = await validateCreateStaff({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Name is required']),
    });
    expect(uniqueness).not.toHaveBeenCalled();
  });

  it('should return conflict when create uniqueness fails', async () => {
    uniqueness.mockResolvedValue({
      success: false,
      errors: ['A user with this email already exists.'],
      status: StatusCodes.CONFLICT,
    });
    const result = await validateCreateStaff(validCreate, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['A user with this email already exists.'],
    });
  });

  it('should surface role validation failures on create', async () => {
    activeRoles.mockResolvedValue({
      success: false,
      errors: ['One or more roles are invalid.'],
      status: StatusCodes.UNPROCESSABLE_ENTITY,
    });
    const result = await validateCreateStaff(validCreate, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: ['One or more roles are invalid.'],
    });
  });

  it('should return normalized role ids on create success', async () => {
    const result = await validateCreateStaff(validCreate, 'tenant-1');
    expect(result).toMatchObject({
      success: true,
      data: { name: 'Asha Rao', email: 'asha@example.com', roleIds: [1] },
    });
  });

  it('should reject changing email or password through update', async () => {
    const result = await validateUpdateStaff('user-1', 'tenant-1', {
      name: 'Asha',
      email: 'new@example.com',
      password: 'whatever123',
    });
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining([
        'Email cannot be changed through this endpoint.',
        'Password cannot be changed through this endpoint.',
      ]),
    });
  });

  it('should return not found on update when the staff does not exist', async () => {
    repo.getStaffByUserId.mockResolvedValue(undefined);
    const result = await validateUpdateStaff('user-1', 'tenant-1', { name: 'Asha' });
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed params on update success', async () => {
    const result = await validateUpdateStaff('user-1', 'tenant-1', { name: 'Asha' });
    expect(result).toEqual({
      success: true,
      data: { userId: 'user-1', tenantId: 'tenant-1', payload: { name: 'Asha' } },
    });
  });

  it('should validate get-by-id and return not found when missing', async () => {
    await expect(validateGetStaffById('user-1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: { userId: 'user-1', tenantId: 'tenant-1' },
    });
    repo.getStaffByUserId.mockResolvedValue(undefined);
    await expect(validateGetStaffById('user-1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });
});
