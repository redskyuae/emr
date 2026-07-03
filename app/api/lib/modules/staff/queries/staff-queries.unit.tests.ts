import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { staffRepository } from '../repository/staff-repository';
import { validateGetStaffById } from '../validator/get-staff-by-id-validator';
import { getStaffByIdQuery } from './get-staff-by-id-query';
import { getStaffQuery } from './get-staff-query';

vi.mock('../repository/staff-repository', () => ({
  staffRepository: {
    getStaffByUserId: vi.fn(),
    getStaff: vi.fn(),
  },
}));
vi.mock('../validator/get-staff-by-id-validator', () => ({ validateGetStaffById: vi.fn() }));

const repo = vi.mocked(staffRepository);
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
const staffWithRoles = { ...staff, roles: [{ id: 1, name: 'Manager' }] };

describe('Staff queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateGetById.mockResolvedValue({
      success: true,
      data: { userId: 'user-1', tenantId: 'tenant-1' },
    });
    repo.getStaffByUserId.mockResolvedValue(staff);
    repo.getStaff.mockResolvedValue({ data: [staffWithRoles], total: 1 });
  });

  it('should return validation failure and not call repository when id validation fails', async () => {
    validateGetById.mockResolvedValue({ success: false, errors: ['Staff ID is required'] });
    const result = await getStaffByIdQuery('', 'tenant-1');
    expect(result).toEqual({ success: false, errors: ['Staff ID is required'] });
    expect(repo.getStaffByUserId).not.toHaveBeenCalled();
  });

  it('should return the staff member on success', async () => {
    await expect(getStaffByIdQuery('user-1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: staff,
    });
    expect(repo.getStaffByUserId).toHaveBeenCalledWith('user-1', 'tenant-1');
  });

  it('should return not found when the repository returns nothing', async () => {
    repo.getStaffByUserId.mockResolvedValue(undefined);
    const result = await getStaffByIdQuery('user-1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return list data with embedded roles and pass filters through', async () => {
    const result = await getStaffQuery({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'asha',
      roleId: 1,
      status: 'active',
    });
    expect(result).toEqual({ success: true, data: [staffWithRoles], total: 1 });
    expect(repo.getStaff).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'asha',
      roleId: 1,
      status: 'active',
    });
  });
});
