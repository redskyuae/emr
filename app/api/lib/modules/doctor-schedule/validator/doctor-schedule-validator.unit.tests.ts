import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';
import { validateCreateDoctorSchedule } from './create-doctor-schedule-validator';
import { validateGetDoctorSchedules } from './get-doctor-schedules-validator';
import { validateGetDoctorSlots } from './get-doctor-slots-validator';
import { validateUpdateDoctorSchedule } from './update-doctor-schedule-validator';

vi.mock('../../doctor/repository/doctor-repository', () => ({
  doctorRepository: { getDoctorById: vi.fn() },
}));
vi.mock('../repository/doctor-schedule-repository', () => ({
  doctorScheduleRepository: {
    getActiveRotaCount: vi.fn(),
    getDoctorScheduleById: vi.fn(),
  },
}));

const doctorRepo = vi.mocked(doctorRepository);
const scheduleRepo = vi.mocked(doctorScheduleRepository);
const doctor = {
  id: 2,
  userId: 'user-1',
  tenantId: 'tenant-1',
  name: 'Anita Mehta',
  email: 'anita@example.com',
  phone: null,
  gender: null,
  staffCode: null,
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
  specialtyId: 1,
  designation: null,
  dateOfBirth: null,
  specialtyName: 'Cardiology',
  qualifications: null,
  registrationNumber: null,
};
const schedule = {
  id: 1,
  tenantId: 'tenant-1',
  doctorId: 2,
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
  slotToDate: '2026-07-20',
  slotInMinute: '00:15',
  slotFromDate: '2026-07-15',
  slotDurationMinutes: 15,
  rotaDetails: [],
};
const payload = {
  doctorId: 2,
  rotaIds: [3],
  slotInMinute: '00:15',
  slotToDate: '2026-07-20',
  slotFromDate: '2026-07-15',
};

describe('DoctorSchedule validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    doctorRepo.getDoctorById.mockResolvedValue(doctor);
    scheduleRepo.getActiveRotaCount.mockResolvedValue(1);
    scheduleRepo.getDoctorScheduleById.mockResolvedValue(schedule);
  });

  it('should return schema validation errors without repository access on create', async () => {
    const result = await validateCreateDoctorSchedule({}, 'tenant-1');
    expect(result).toMatchObject({ success: false });
    expect(doctorRepo.getDoctorById).not.toHaveBeenCalled();
    expect(scheduleRepo.getActiveRotaCount).not.toHaveBeenCalled();
  });

  it('should return validation errors without repository access when create rota ids are duplicated', async () => {
    const result = await validateCreateDoctorSchedule(
      { ...payload, rotaIds: [3, 3, 4] },
      'tenant-1'
    );
    expect(result).toEqual({
      success: false,
      errors: ['Doctor rota IDs must be unique'],
    });
    expect(doctorRepo.getDoctorById).not.toHaveBeenCalled();
    expect(scheduleRepo.getActiveRotaCount).not.toHaveBeenCalled();
  });

  it('should return invalid doctor when doctor is not active in tenant', async () => {
    doctorRepo.getDoctorById.mockResolvedValue(undefined);
    await expect(validateCreateDoctorSchedule(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Doctor 2 is Invalid.'],
    });
  });

  it('should return invalid rota when any rota is missing or inactive', async () => {
    scheduleRepo.getActiveRotaCount.mockResolvedValue(0);
    await expect(validateCreateDoctorSchedule(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['One or more Doctor rotas are invalid.'],
    });
  });

  it('should return parsed create data on success', async () => {
    await expect(validateCreateDoctorSchedule(payload, 'tenant-1')).resolves.toEqual({
      success: true,
      data: {
        doctorId: 2,
        rotaIds: [3],
        slotToDate: '2026-07-20',
        slotFromDate: '2026-07-15',
        slotDurationMinutes: 15,
      },
    });
  });

  it('should return schema validation errors without repository access on update', async () => {
    const result = await validateUpdateDoctorSchedule({ doctorScheduleId: 1 }, 'tenant-1');
    expect(result).toMatchObject({ success: false });
    expect(scheduleRepo.getDoctorScheduleById).not.toHaveBeenCalled();
  });

  it('should return not-found when update target does not exist', async () => {
    scheduleRepo.getDoctorScheduleById.mockResolvedValue(undefined);
    await expect(
      validateUpdateDoctorSchedule({ doctorScheduleId: 1, rotaIds: [3] }, 'tenant-1')
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Doctor schedule not found'],
    });
  });

  it('should validate update rotas without performing overlap checks outside the write transaction', async () => {
    await validateUpdateDoctorSchedule({ doctorScheduleId: 1, rotaIds: [3] }, 'tenant-1');
    expect(scheduleRepo.getActiveRotaCount).toHaveBeenCalledWith('tenant-1', [3]);
  });

  it('should validate list and slot params', () => {
    expect(validateGetDoctorSchedules({ tenantId: 'tenant-1', doctorId: '2' })).toEqual({
      success: true,
      data: { tenantId: 'tenant-1', doctorId: 2 },
    });
    expect(
      validateGetDoctorSlots({ tenantId: 'tenant-1', doctorId: '2', slotDate: '2026-07-15' })
    ).toEqual({
      success: true,
      data: { tenantId: 'tenant-1', doctorId: 2, slotDate: '2026-07-15' },
    });
  });
});
