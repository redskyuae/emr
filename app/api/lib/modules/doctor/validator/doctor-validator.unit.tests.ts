import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { specialtyRepository } from '../../specialty/repository/specialty-repository';
import { staffRepository } from '../../staff/repository/staff-repository';
import { doctorRepository } from '../repository/doctor-repository';
import { validateCreateDoctor } from './create-doctor-validator';
import { validateDoctorExists } from './doctor-exists-validator';
import { validateGetDoctorById } from './get-doctor-by-id-validator';
import { validateGetDoctors } from './get-doctors-validator';
import { validateUpdateDoctor } from './update-doctor-validator';

vi.mock('../../specialty/repository/specialty-repository', () => ({
  specialtyRepository: { getSpecialtyById: vi.fn() },
}));
vi.mock('../../staff/repository/staff-repository', () => ({
  staffRepository: { findUserByEmail: vi.fn(), findNonDeletedByStaffCode: vi.fn() },
}));
vi.mock('../repository/doctor-repository', () => ({
  doctorRepository: {
    getDoctorById: vi.fn(),
    findActiveByRegistrationNumber: vi.fn(),
  },
}));

const specialtyRepo = vi.mocked(specialtyRepository);
const staffRepo = vi.mocked(staffRepository);
const doctorRepo = vi.mocked(doctorRepository);

const payload = {
  name: 'Anita Mehta',
  email: 'anita@example.com',
  password: 'password123',
  specialtyId: 7,
  staffCode: 'DOC-1',
  registrationNumber: 'TN-123',
};

const doctor = {
  id: 1,
  name: 'Anita Mehta',
  email: 'anita@example.com',
  phone: null,
  userId: 'user-1',
  tenantId: 'tenant-1',
  isActive: true,
  staffCode: 'DOC-1',
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

describe('Doctor validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    specialtyRepo.getSpecialtyById.mockResolvedValue({ id: 7 } as never);
    staffRepo.findUserByEmail.mockResolvedValue(undefined as never);
    staffRepo.findNonDeletedByStaffCode.mockResolvedValue(undefined);
    doctorRepo.findActiveByRegistrationNumber.mockResolvedValue(undefined);
    doctorRepo.getDoctorById.mockResolvedValue(doctor);
  });

  it('should not call repositories when create schema parsing fails', async () => {
    await validateCreateDoctor({}, 'tenant-1');

    expect(specialtyRepo.getSpecialtyById).not.toHaveBeenCalled();
    expect(doctorRepo.findActiveByRegistrationNumber).not.toHaveBeenCalled();
    expect(staffRepo.findUserByEmail).not.toHaveBeenCalled();
  });

  it('should return validation errors without repository calls when list Tenant parsing fails', () => {
    expect(validateGetDoctors({ tenantId: '   ' })).toEqual({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
    expect(doctorRepo.getDoctorById).not.toHaveBeenCalled();
    expect(doctorRepo.findActiveByRegistrationNumber).not.toHaveBeenCalled();
  });

  it('should reject invalid Doctor list filters', () => {
    expect(
      validateGetDoctors({
        tenantId: 'tenant-1',
        specialtyId: 'bad',
        status: 'archived',
      })
    ).toEqual({
      success: false,
      errors: ['Specialty ID must be a number', 'Doctor status is invalid'],
    });
  });

  it('should return parsed list parameters for valid raw input', () => {
    expect(
      validateGetDoctors({
        page: '2',
        limit: '5',
        query: ' Anita ',
        tenantId: ' tenant-1 ',
        specialtyId: '7',
        status: 'active',
      })
    ).toEqual({
      success: true,
      data: {
        page: 2,
        limit: 5,
        query: 'Anita',
        tenantId: 'tenant-1',
        specialtyId: 7,
        status: 'active',
      },
    });
  });

  it('should reject a Specialty outside the Tenant', async () => {
    specialtyRepo.getSpecialtyById.mockResolvedValue(undefined as never);

    await expect(validateCreateDoctor(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Specialty 7 is Invalid.'],
      status: undefined,
    });
  });

  it('should reject duplicate registration number and email with exact messages', async () => {
    doctorRepo.findActiveByRegistrationNumber.mockResolvedValue(doctor);
    staffRepo.findUserByEmail.mockResolvedValue({ id: 'user-2' } as never);

    await expect(validateCreateDoctor(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: [
        'Doctor registration number TN-123 already exists.',
        'A Staff member with this email already exists.',
      ],
    });
  });

  it('should pass exclude IDs to update uniqueness checks', async () => {
    await validateUpdateDoctor('1', 'tenant-1', {
      specialtyId: 7,
      staffCode: 'DOC-2',
      registrationNumber: 'TN-456',
    });

    expect(doctorRepo.findActiveByRegistrationNumber).toHaveBeenCalledWith('tenant-1', 'TN-456', {
      excludeId: 1,
    });
    expect(staffRepo.findNonDeletedByStaffCode).toHaveBeenCalledWith('tenant-1', 'DOC-2', {
      excludeUserId: 'user-1',
    });
  });

  it('should reject credential updates', async () => {
    const result = await validateUpdateDoctor('1', 'tenant-1', {
      name: 'New Name',
      email: 'new@example.com',
      password: 'new-password',
    });

    expect(result).toMatchObject({
      success: false,
      errors: [
        'Email cannot be changed through this endpoint.',
        'Password cannot be changed through this endpoint.',
      ],
    });
    expect(doctorRepo.getDoctorById).not.toHaveBeenCalled();
  });

  it('should return not found for a missing Doctor on update and lifecycle validation', async () => {
    doctorRepo.getDoctorById.mockResolvedValue(undefined);

    await expect(validateUpdateDoctor('1', 'tenant-1', { name: 'New Name' })).resolves.toEqual({
      success: false,
      errors: ['Doctor not found'],
      status: StatusCodes.NOT_FOUND,
    });
    await expect(validateDoctorExists('1', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Doctor not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should validate Doctor ID without leaking another Tenant', () => {
    expect(validateGetDoctorById('bad', 'tenant-1')).toEqual({
      success: false,
      errors: ['Doctor bad is Invalid.'],
    });
  });
});
