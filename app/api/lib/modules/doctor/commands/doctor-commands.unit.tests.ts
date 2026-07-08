import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from '@/app/lib/auth';
import { roleRepository } from '../../role/repository/role-repository';
import { StaffTenantMembershipConflictError } from '../../staff/errors/staff-tenant-membership-conflict-error';
import { staffRepository } from '../../staff/repository/staff-repository';
import { doctorRepository } from '../repository/doctor-repository';
import { validateCreateDoctor } from '../validator/create-doctor-validator';
import { validateDoctorExists } from '../validator/doctor-exists-validator';
import { validateUpdateDoctor } from '../validator/update-doctor-validator';
import { createDoctorCommand } from './create-doctor-command';
import { deactivateDoctorCommand } from './deactivate-doctor-command';
import { reactivateDoctorCommand } from './reactivate-doctor-command';
import { updateDoctorCommand } from './update-doctor-command';

vi.mock('@/app/lib/auth', () => ({ auth: { api: { createUser: vi.fn() } } }));
vi.mock('../../role/repository/role-repository', () => ({
  roleRepository: { getSystemRoleByCode: vi.fn() },
}));
vi.mock('../../staff/repository/staff-repository', () => ({
  staffRepository: { deleteAuthUserIfUnprovisioned: vi.fn() },
}));
vi.mock('../repository/doctor-repository', () => ({
  doctorRepository: { createDoctor: vi.fn(), updateDoctor: vi.fn(), setDoctorActive: vi.fn() },
}));
vi.mock('../validator/create-doctor-validator', () => ({ validateCreateDoctor: vi.fn() }));
vi.mock('../validator/update-doctor-validator', () => ({ validateUpdateDoctor: vi.fn() }));
vi.mock('../validator/doctor-exists-validator', () => ({ validateDoctorExists: vi.fn() }));

const createUser = vi.mocked(auth.api.createUser);
const roleRepo = vi.mocked(roleRepository);
const staffRepo = vi.mocked(staffRepository);
const doctorRepo = vi.mocked(doctorRepository);
const validateCreate = vi.mocked(validateCreateDoctor);
const validateUpdate = vi.mocked(validateUpdateDoctor);
const validateExists = vi.mocked(validateDoctorExists);

const createInput = {
  name: 'Anita Mehta',
  email: 'anita@example.com',
  password: 'password123',
  specialtyId: 7,
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

describe('Doctor commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({ success: true, data: createInput });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, userId: 'user-1', payload: { name: 'Dr Anita' } },
    });
    validateExists.mockResolvedValue({ success: true, data: doctor });
    roleRepo.getSystemRoleByCode.mockResolvedValue({ id: 9 } as never);
    createUser.mockResolvedValue({ user: { id: 'user-1' } } as never);
    staffRepo.deleteAuthUserIfUnprovisioned.mockResolvedValue(true);
    doctorRepo.createDoctor.mockResolvedValue(doctor);
    doctorRepo.updateDoctor.mockResolvedValue(doctor);
    doctorRepo.setDoctorActive.mockResolvedValue(doctor);
  });

  it('should validate before creating any Doctor artifacts', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });

    await expect(createDoctorCommand({}, 'tenant-1', 'admin-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
      status: 422,
    });
    expect(roleRepo.getSystemRoleByCode).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(doctorRepo.createDoctor).not.toHaveBeenCalled();
  });

  it('should auto-assign the Tenant Doctor System Role', async () => {
    await expect(createDoctorCommand(createInput, 'tenant-1', 'admin-1')).resolves.toEqual({
      success: true,
      data: doctor,
    });
    expect(roleRepo.getSystemRoleByCode).toHaveBeenCalledWith('tenant-1', 'DOCTOR');
    expect(doctorRepo.createDoctor).toHaveBeenCalledWith({
      ...createInput,
      userId: 'user-1',
      tenantId: 'tenant-1',
      roleId: 9,
      assignedBy: 'admin-1',
    });
  });

  it('should return a clear error before user creation when Doctor Role is missing', async () => {
    roleRepo.getSystemRoleByCode.mockResolvedValue(undefined);

    await expect(createDoctorCommand(createInput, 'tenant-1', 'admin-1')).resolves.toEqual({
      success: false,
      errors: ['Doctor role not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(createUser).not.toHaveBeenCalled();
  });

  it('should map duplicate auth email to the Doctor conflict message', async () => {
    createUser.mockRejectedValue({ body: { code: 'USER_ALREADY_EXISTS' } });

    await expect(createDoctorCommand(createInput, 'tenant-1', 'admin-1')).resolves.toEqual({
      success: false,
      errors: ['A Staff member with this email already exists.'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should clean up the auth user and map registration races to conflict', async () => {
    doctorRepo.createDoctor.mockRejectedValue({
      cause: { code: '23505', constraint: 'doctor_tenant_registration_number_idx' },
    });

    await expect(createDoctorCommand(createInput, 'tenant-1', 'admin-1')).resolves.toEqual({
      success: false,
      errors: ['Doctor registration number TN-123 already exists.'],
      status: StatusCodes.CONFLICT,
    });
    expect(staffRepo.deleteAuthUserIfUnprovisioned).toHaveBeenCalledWith('user-1');
  });

  it('should clean up the auth user and rethrow unknown aggregate failures', async () => {
    const error = new Error('database unavailable');
    doctorRepo.createDoctor.mockRejectedValue(error);

    await expect(createDoctorCommand(createInput, 'tenant-1', 'admin-1')).rejects.toThrow(error);
    expect(staffRepo.deleteAuthUserIfUnprovisioned).toHaveBeenCalledWith('user-1');
  });

  it('should map cross-Tenant Staff membership to conflict', async () => {
    doctorRepo.createDoctor.mockRejectedValue(new StaffTenantMembershipConflictError());

    await expect(createDoctorCommand(createInput, 'tenant-1', 'admin-1')).resolves.toEqual({
      success: false,
      errors: ['Staff user already belongs to a Tenant.'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should warn with the user ID and cleanup error while preserving the create failure', async () => {
    const createError = new Error('database unavailable');
    const cleanupError = new Error('cleanup unavailable');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    doctorRepo.createDoctor.mockRejectedValue(createError);
    staffRepo.deleteAuthUserIfUnprovisioned.mockRejectedValue(cleanupError);

    await expect(createDoctorCommand(createInput, 'tenant-1', 'admin-1')).rejects.toThrow(
      createError
    );
    expect(warn).toHaveBeenCalledWith('Failed to clean up created BetterAuth user', {
      userId: 'user-1',
      error: cleanupError,
    });

    warn.mockRestore();
  });

  it('should warn when cleanup is skipped for a user with linked data', async () => {
    const createError = new Error('database unavailable');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    doctorRepo.createDoctor.mockRejectedValue(createError);
    staffRepo.deleteAuthUserIfUnprovisioned.mockResolvedValue(false);

    await expect(createDoctorCommand(createInput, 'tenant-1', 'admin-1')).rejects.toThrow(
      createError
    );
    expect(warn).toHaveBeenCalledWith('Skipped cleanup of BetterAuth user with linked data', {
      userId: 'user-1',
    });

    warn.mockRestore();
  });

  it('should validate before update and map the successful aggregate update', async () => {
    await expect(updateDoctorCommand('1', 'tenant-1', { name: 'Dr Anita' })).resolves.toEqual({
      success: true,
      data: doctor,
    });
    expect(doctorRepo.updateDoctor).toHaveBeenCalledWith(1, {
      tenantId: 'tenant-1',
      name: 'Dr Anita',
    });
  });

  it('should not update when update validation fails', async () => {
    validateUpdate.mockResolvedValue({ success: false, errors: ['Invalid'] });

    await updateDoctorCommand('bad', 'tenant-1', {});

    expect(doctorRepo.updateDoctor).not.toHaveBeenCalled();
  });

  it('should map an update unique constraint violation to conflict', async () => {
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        userId: 'user-1',
        payload: { registrationNumber: 'TN-456' },
      },
    });
    doctorRepo.updateDoctor.mockRejectedValue({
      cause: { code: '23505', constraint: 'doctor_tenant_registration_number_idx' },
    });

    await expect(
      updateDoctorCommand('1', 'tenant-1', { registrationNumber: 'TN-456' })
    ).resolves.toEqual({
      success: false,
      errors: ['Doctor registration number TN-456 already exists.'],
      status: StatusCodes.CONFLICT,
    });
  });

  it('should rethrow an unknown update repository error unchanged', async () => {
    const error = new Error('database unavailable');
    doctorRepo.updateDoctor.mockRejectedValue(error);

    await expect(updateDoctorCommand('1', 'tenant-1', { name: 'Dr Anita' })).rejects.toBe(error);
  });

  it.each([
    ['deactivate', deactivateDoctorCommand, false],
    ['reactivate', reactivateDoctorCommand, true],
  ] as const)(
    'should validate before %s and map repository success',
    async (_operation, command, isActive) => {
      await expect(command('1', 'tenant-1')).resolves.toEqual({ success: true, data: doctor });
      expect(validateExists).toHaveBeenCalledWith('1', 'tenant-1');
      expect(doctorRepo.setDoctorActive).toHaveBeenCalledWith(1, 'tenant-1', isActive);
      expect(validateExists.mock.invocationCallOrder[0]).toBeLessThan(
        doctorRepo.setDoctorActive.mock.invocationCallOrder[0]
      );
    }
  );

  it.each([
    ['deactivate', deactivateDoctorCommand],
    ['reactivate', reactivateDoctorCommand],
  ] as const)('should not write when %s validation fails', async (_operation, command) => {
    validateExists.mockResolvedValue({
      success: false,
      errors: ['Doctor not found'],
      status: StatusCodes.NOT_FOUND,
    });

    await expect(command('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Doctor not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(doctorRepo.setDoctorActive).not.toHaveBeenCalled();
  });

  it.each([
    ['deactivate', deactivateDoctorCommand, false],
    ['reactivate', reactivateDoctorCommand, true],
  ] as const)(
    'should return not found when %s write finds no Doctor',
    async (_operation, command, isActive) => {
      doctorRepo.setDoctorActive.mockResolvedValue(null as never);

      await expect(command('1', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Doctor not found'],
        status: StatusCodes.NOT_FOUND,
      });
      expect(doctorRepo.setDoctorActive).toHaveBeenCalledWith(1, 'tenant-1', isActive);
    }
  );
});
