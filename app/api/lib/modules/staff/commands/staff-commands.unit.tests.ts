import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { staffRepository } from '../repository/staff-repository';
import { auth } from '@/app/lib/auth';
import { validateCreateStaff } from '../validator/create-staff-validator';
import { validateGetStaffById } from '../validator/get-staff-by-id-validator';
import { validateUpdateStaff } from '../validator/update-staff-validator';
import { createStaffCommand } from './create-staff-command';
import { deactivateStaffCommand } from './deactivate-staff-command';
import { reactivateStaffCommand } from './reactivate-staff-command';
import { updateStaffCommand } from './update-staff-command';

vi.mock('../repository/staff-repository', () => ({
  staffRepository: {
    createStaffProfile: vi.fn(),
    updateStaff: vi.fn(),
    setStaffActive: vi.fn(),
    deleteAuthUser: vi.fn(),
  },
}));
vi.mock('@/app/lib/auth', () => ({ auth: { api: { createUser: vi.fn() } } }));
vi.mock('../validator/create-staff-validator', () => ({ validateCreateStaff: vi.fn() }));
vi.mock('../validator/update-staff-validator', () => ({ validateUpdateStaff: vi.fn() }));
vi.mock('../validator/get-staff-by-id-validator', () => ({ validateGetStaffById: vi.fn() }));

const repo = vi.mocked(staffRepository);
const createUser = vi.mocked(auth.api.createUser);
const validateCreate = vi.mocked(validateCreateStaff);
const validateUpdate = vi.mocked(validateUpdateStaff);
const validateGetById = vi.mocked(validateGetStaffById);
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

describe('Staff commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: { name: 'Asha Rao', email: 'asha@example.com', password: 'supersecret', roleIds: [1] },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { userId: 'user-1', tenantId: 'tenant-1', payload: { name: 'Asha' } },
    });
    validateGetById.mockResolvedValue({
      success: true,
      data: { userId: 'user-1', tenantId: 'tenant-1' },
    });
    createUser.mockResolvedValue({ user: { id: 'user-1' } } as never);
    repo.createStaffProfile.mockResolvedValue(staff);
    repo.updateStaff.mockResolvedValue(staff);
    repo.setStaffActive.mockResolvedValue(staff);
  });

  it('should return validation failure and not create a user when the validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    const result = await createStaffCommand({}, 'tenant-1', 'admin');
    expect(result).toEqual({ success: false, errors: ['Invalid'], status: 422 });
    expect(createUser).not.toHaveBeenCalled();
  });

  it('should create the auth user and staff profile on success', async () => {
    const result = await createStaffCommand({}, 'tenant-1', 'admin');
    expect(createUser).toHaveBeenCalled();
    expect(repo.createStaffProfile).toHaveBeenCalledWith(
      'user-1',
      'tenant-1',
      expect.objectContaining({ email: 'asha@example.com' }),
      'admin'
    );
    expect(result).toEqual({ success: true, data: staff });
  });

  it('should clean up the created user and return not found when the profile is missing', async () => {
    repo.createStaffProfile.mockResolvedValue(undefined);
    const result = await createStaffCommand({}, 'tenant-1', 'admin');
    expect(repo.deleteAuthUser).toHaveBeenCalledWith('user-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should map a duplicate email constraint to a conflict error', async () => {
    repo.createStaffProfile.mockRejectedValue({ code: '23505', constraint: 'user_email_unique' });
    const result = await createStaffCommand({}, 'tenant-1', 'admin');
    expect(repo.deleteAuthUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['A user with this email already exists.'],
    });
  });

  it('should map an auth duplicate-user error to a conflict error', async () => {
    createUser.mockRejectedValue({ body: { code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' } });
    const result = await createStaffCommand({}, 'tenant-1', 'admin');
    expect(result).toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['A user with this email already exists.'],
    });
  });

  it('should deactivate a staff member', async () => {
    await expect(deactivateStaffCommand('user-1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: staff,
    });
    expect(repo.setStaffActive).toHaveBeenCalledWith('user-1', 'tenant-1', false);
  });

  it('should return not found when deactivation finds no row', async () => {
    repo.setStaffActive.mockResolvedValue(undefined);
    await expect(deactivateStaffCommand('user-1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should reactivate a staff member', async () => {
    await expect(reactivateStaffCommand('user-1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: staff,
    });
    expect(repo.setStaffActive).toHaveBeenCalledWith('user-1', 'tenant-1', true);
  });

  it('should return validation failure for deactivate when the validator fails', async () => {
    validateGetById.mockResolvedValue({ success: false, errors: ['Staff not found'], status: 404 });
    await expect(deactivateStaffCommand('user-1', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Staff not found'],
      status: 404,
    });
  });

  it('should update a staff member', async () => {
    await expect(updateStaffCommand('user-1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: staff,
    });
  });

  it('should return not found when update finds no row', async () => {
    repo.updateStaff.mockResolvedValue(undefined);
    await expect(updateStaffCommand('user-1', 'tenant-1', {})).resolves.toMatchObject({
      success: false,
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should map a duplicate staff code constraint on update to a conflict error', async () => {
    validateUpdate.mockResolvedValue({
      success: true,
      data: { userId: 'user-1', tenantId: 'tenant-1', payload: { staffCode: 'EMP1' } },
    });
    repo.updateStaff.mockRejectedValue({
      code: '23505',
      constraint: 'staff_profile_tenant_staff_code_idx',
    });
    await expect(updateStaffCommand('user-1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Staff code 'EMP1' already exists."],
    });
  });
});
