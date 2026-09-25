import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { therapistRepository } from '../../therapist/repository/therapist-repository';
import { therapistScheduleRepository } from '../repository/therapist-schedule-repository';
import { validateCreateTherapistSchedule } from './create-therapist-schedule-validator';
import { validateGetTherapistSchedules } from './get-therapist-schedules-validator';
import { validateUpdateTherapistSchedule } from './update-therapist-schedule-validator';

vi.mock('../../therapist/repository/therapist-repository', () => ({
  therapistRepository: { getTherapistById: vi.fn() },
}));
vi.mock('../repository/therapist-schedule-repository', () => ({
  therapistScheduleRepository: {
    getActiveRotaCount: vi.fn(),
    getTherapistScheduleById: vi.fn(),
  },
}));

const therapistRepo = vi.mocked(therapistRepository);
const scheduleRepo = vi.mocked(therapistScheduleRepository);
const payload = {
  therapistId: 2,
  rotaIds: [3],
  slotInMinute: 30,
  slotToDate: '2026-09-30',
  slotFromDate: '2026-09-24',
};
const therapist = {
  id: 2,
  tenantId: 'tenant-1',
  userId: 'user-1',
  name: 'Meera Nair',
  email: 'meera@example.com',
  phone: null,
  staffCode: null,
  designation: null,
  gender: null,
  dateOfBirth: null,
  qualifications: null,
  registrationNumber: null,
  isActive: true,
  createdOn: new Date(),
  modifiedOn: new Date(),
  skills: [],
};
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

describe('TherapistSchedule validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    therapistRepo.getTherapistById.mockResolvedValue(therapist);
    scheduleRepo.getActiveRotaCount.mockResolvedValue(1);
    scheduleRepo.getTherapistScheduleById.mockResolvedValue(schedule);
  });

  it('should stop before repository checks when create schema validation fails', async () => {
    expect(await validateCreateTherapistSchedule({}, 'tenant-1')).toMatchObject({ success: false });
    expect(therapistRepo.getTherapistById).not.toHaveBeenCalled();
    expect(scheduleRepo.getActiveRotaCount).not.toHaveBeenCalled();
  });

  it('should reject an inactive or missing Therapist', async () => {
    therapistRepo.getTherapistById.mockResolvedValue(undefined);
    await expect(validateCreateTherapistSchedule(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Therapist 2 is Invalid.'],
    });
  });

  it('should reject invalid rotas and return parsed input on success', async () => {
    scheduleRepo.getActiveRotaCount.mockResolvedValueOnce(0);
    await expect(validateCreateTherapistSchedule(payload, 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['One or more rotas are invalid.'],
    });
    await expect(validateCreateTherapistSchedule(payload, 'tenant-1')).resolves.toMatchObject({
      success: true,
      data: { therapistId: 2, rotaIds: [3], slotDurationMinutes: 30 },
    });
  });

  it('should return not found before validating update references', async () => {
    scheduleRepo.getTherapistScheduleById.mockResolvedValue(undefined);
    await expect(
      validateUpdateTherapistSchedule({ therapistScheduleId: 1, rotaIds: [3] }, 'tenant-1')
    ).resolves.toEqual({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Therapist schedule not found'],
    });
  });

  it('should validate and coerce list parameters', () => {
    expect(validateGetTherapistSchedules({ tenantId: 'tenant-1', therapistId: '2' })).toEqual({
      success: true,
      data: { tenantId: 'tenant-1', therapistId: 2 },
    });
  });
});
