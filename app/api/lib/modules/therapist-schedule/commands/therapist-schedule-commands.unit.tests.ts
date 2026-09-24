import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TherapistScheduleOverlapError } from '../errors/therapist-schedule-overlap-error';
import { therapistScheduleRepository } from '../repository/therapist-schedule-repository';
import { validateCreateTherapistSchedule } from '../validator/create-therapist-schedule-validator';
import { validateUpdateTherapistSchedule } from '../validator/update-therapist-schedule-validator';
import { createTherapistScheduleCommand } from './create-therapist-schedule-command';
import { updateTherapistScheduleCommand } from './update-therapist-schedule-command';

vi.mock('../repository/therapist-schedule-repository', () => ({
  therapistScheduleRepository: {
    createTherapistSchedule: vi.fn(),
    updateTherapistSchedule: vi.fn(),
  },
}));
vi.mock('../validator/create-therapist-schedule-validator', () => ({
  validateCreateTherapistSchedule: vi.fn(),
}));
vi.mock('../validator/update-therapist-schedule-validator', () => ({
  validateUpdateTherapistSchedule: vi.fn(),
}));

const repo = vi.mocked(therapistScheduleRepository);
const validateCreate = vi.mocked(validateCreateTherapistSchedule);
const validateUpdate = vi.mocked(validateUpdateTherapistSchedule);
const schedule = {
  id: 1,
  tenantId: 'tenant-1',
  therapistId: 2,
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
  slotToDate: '2026-09-30',
  slotFromDate: '2026-09-24',
  slotInMinute: '00:30',
  slotDurationMinutes: 30,
  rotaDetails: [],
};

describe('TherapistSchedule commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateCreate.mockResolvedValue({
      success: true,
      data: {
        therapistId: 2,
        rotaIds: [3],
        slotToDate: '2026-09-30',
        slotFromDate: '2026-09-24',
        slotDurationMinutes: 30,
      },
    });
    validateUpdate.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        payload: {
          rotaIds: [3],
          rotaType: 'new',
          therapistId: undefined,
          slotToDate: undefined,
          slotFromDate: undefined,
          slotDurationMinutes: undefined,
        },
      },
    });
    repo.createTherapistSchedule.mockResolvedValue(schedule);
    repo.updateTherapistSchedule.mockResolvedValue(schedule);
  });

  it('should not write when validation fails', async () => {
    validateCreate.mockResolvedValue({ success: false, errors: ['Invalid'], status: 422 });
    await expect(createTherapistScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
      status: 422,
    });
    expect(repo.createTherapistSchedule).not.toHaveBeenCalled();
  });

  it('should add the tenant id to validated create data', async () => {
    await createTherapistScheduleCommand({}, 'tenant-1');
    expect(repo.createTherapistSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', therapistId: 2 })
    );
  });

  it('should map overlap and unique constraint errors to conflict', async () => {
    repo.createTherapistSchedule.mockRejectedValue(new TherapistScheduleOverlapError());
    await expect(createTherapistScheduleCommand({}, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Therapist schedule overlaps with an existing schedule.'],
    });
    repo.updateTherapistSchedule.mockRejectedValue({
      cause: { code: '23505', constraint: 'therapist_schedule_rota_active_idx' },
    });
    await expect(updateTherapistScheduleCommand({}, 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Therapist schedule contains duplicate rotas.'],
    });
  });

  it('should return repository data and preserve update not found', async () => {
    await expect(createTherapistScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: true,
      data: schedule,
    });
    repo.updateTherapistSchedule.mockResolvedValue(undefined);
    await expect(updateTherapistScheduleCommand({}, 'tenant-1')).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Therapist schedule not found'],
    });
  });
});
