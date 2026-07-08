import { beforeEach, describe, expect, it, vi } from 'vitest';

import { doctorRepository } from '../repository/doctor-repository';
import { validateGetDoctorById } from '../validator/get-doctor-by-id-validator';
import { validateGetDoctors } from '../validator/get-doctors-validator';
import { getDoctorByIdQuery } from './get-doctor-by-id-query';
import { getDoctorsQuery } from './get-doctors-query';

vi.mock('../repository/doctor-repository', () => ({
  doctorRepository: { getDoctorById: vi.fn(), getDoctors: vi.fn() },
}));
vi.mock('../validator/get-doctor-by-id-validator', () => ({ validateGetDoctorById: vi.fn() }));
vi.mock('../validator/get-doctors-validator', () => ({ validateGetDoctors: vi.fn() }));

const repo = vi.mocked(doctorRepository);
const validateById = vi.mocked(validateGetDoctorById);
const validateList = vi.mocked(validateGetDoctors);

const doctor = {
  id: 1,
  name: 'Anita Mehta',
  email: 'anita@example.com',
  phone: null,
  userId: 'user-1',
  tenantId: 'tenant-1',
  isActive: true,
  staffCode: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
  specialtyId: 7,
  dateOfBirth: null,
  designation: null,
  gender: null,
  specialtyName: 'Cardiology',
  qualifications: null,
  registrationNumber: 'TN-123',
};

describe('Doctor queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: { tenantId: 'tenant-1' } });
    repo.getDoctorById.mockResolvedValue(doctor);
    repo.getDoctors.mockResolvedValue({ data: [doctor], total: 1 });
  });

  it('should short-circuit get by ID when validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });

    await expect(getDoctorByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getDoctorById).not.toHaveBeenCalled();
  });

  it('should return not found when the Doctor is absent in the Tenant', async () => {
    repo.getDoctorById.mockResolvedValue(undefined);

    await expect(getDoctorByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: 404,
    });
  });

  it('should pass list pagination and filters to the repository', async () => {
    const params = {
      page: 2,
      limit: 5,
      query: 'Anita',
      tenantId: 'tenant-1',
      specialtyId: 7,
      status: 'active' as const,
    };
    validateList.mockReturnValue({ success: true, data: params });

    await expect(getDoctorsQuery(params)).resolves.toEqual({
      success: true,
      data: [doctor],
      total: 1,
    });
    expect(repo.getDoctors).toHaveBeenCalledWith(params);
  });

  it('should not list Doctors when tenant validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Tenant ID is required'] });

    await getDoctorsQuery({ tenantId: '' });

    expect(repo.getDoctors).not.toHaveBeenCalled();
  });
});
