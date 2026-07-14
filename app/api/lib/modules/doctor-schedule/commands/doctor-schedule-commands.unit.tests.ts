import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DoctorScheduleOverlapError } from '../errors/doctor-schedule-overlap-error';
import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';
import { validateCreateDoctorSchedule } from '../validator/create-doctor-schedule-validator';
import { validateUpdateDoctorSchedule } from '../validator/update-doctor-schedule-validator';
import { createDoctorScheduleCommand } from './create-doctor-schedule-command';
import { updateDoctorScheduleCommand } from './update-doctor-schedule-command';

vi.mock('../repository/doctor-schedule-repository', () => ({
  doctorScheduleRepository: {
    createDoctorSchedule: vi.fn(),
    updateDoctorSchedule: vi.fn(),
  },
}));
vi.mock('../validator/create-doctor-schedule-validator', () => ({
  validateCreateDoctorSchedule: vi.fn(),
}));
vi.mock('../validator/update-doctor-schedule-validator', () => ({
  validateUpdateDoctorSchedule: vi.fn(),
}));

const repo = vi.mocked(doctorScheduleRepository);
const validateCreate = vi.mocked(validateCreateDoctorSchedule);
const validateUpdate = vi.mocked(validateUpdateDoctorSchedule);
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

describe('DoctorSchedule commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: {
        doctorId: 2,
        rotaIds: [3],
        slotToDate: '2026-07-20',
        slotFromDate: '2026-07-15',
        slotDurationMinutes: 15,
      },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: { id: 1, payload: { rotaIds: [3], rotaType: 'new' } },
    });
    repo.createDoctorSchedule.mockResolvedValue(schedule);
    repo.updateDoctorSchedule.mockResolvedValue(schedule);
  });

  it('should return validation failure and not create when validator fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    await expect(createDoctorScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
      status: 422,
    });
    expect(repo.createDoctorSchedule).not.toHaveBeenCalled();
  });

  it('should create with parsed validation data plus tenant id', async () => {
    await createDoctorScheduleCommand({}, 'tenant-1');
    expect(repo.createDoctorSchedule).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      doctorId: 2,
      rotaIds: [3],
      slotToDate: '2026-07-20',
      slotFromDate: '2026-07-15',
      slotDurationMinutes: 15,
    });
  });

  it('should return validation failure and not update when validator fails', async () => {
    validateUpdate.mockResolvedValue({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Overlap'],
    });
    await expect(updateDoctorScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Overlap'],
    });
    expect(repo.updateDoctorSchedule).not.toHaveBeenCalled();
  });

  it('should return not-found when update repository does not find schedule', async () => {
    repo.updateDoctorSchedule.mockResolvedValue(undefined);
    await expect(updateDoctorScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Doctor schedule not found'],
    });
  });

  it('should map repository overlap errors to conflict on create and update', async () => {
    repo.createDoctorSchedule.mockRejectedValue(new DoctorScheduleOverlapError());
    repo.updateDoctorSchedule.mockRejectedValue(new DoctorScheduleOverlapError());

    await expect(createDoctorScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Doctor schedule overlaps with an existing schedule.'],
    });
    await expect(updateDoctorScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Doctor schedule overlaps with an existing schedule.'],
    });
  });

  it('should map create Postgres unique constraint 23505 to conflict error', async () => {
    repo.createDoctorSchedule.mockRejectedValue({
      cause: { code: '23505', constraint: 'doctor_schedule_rota_active_idx' },
    });

    await expect(createDoctorScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Doctor schedule contains duplicate Doctor rotas.'],
    });
  });

  it('should map update Postgres unique constraint 23505 to conflict error', async () => {
    repo.updateDoctorSchedule.mockRejectedValue({
      cause: { code: '23505', constraint: 'doctor_schedule_rota_active_idx' },
    });

    await expect(updateDoctorScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Doctor schedule contains duplicate Doctor rotas.'],
    });
  });

  it('should rethrow non-23505 create repository errors', async () => {
    const error = new Error('database down');
    repo.createDoctorSchedule.mockRejectedValue(error);

    await expect(createDoctorScheduleCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should rethrow non-23505 update repository errors', async () => {
    const error = new Error('database down');
    repo.updateDoctorSchedule.mockRejectedValue(error);

    await expect(updateDoctorScheduleCommand({}, 'tenant-1')).rejects.toThrow(error);
  });

  it('should return created and updated data on repository success', async () => {
    await expect(createDoctorScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: schedule,
    });
    await expect(updateDoctorScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: schedule,
    });
  });
});
