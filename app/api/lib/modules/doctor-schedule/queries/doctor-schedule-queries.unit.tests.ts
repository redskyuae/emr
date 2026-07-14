import { beforeEach, describe, expect, it, vi } from 'vitest';

import { doctorScheduleRepository } from '../repository/doctor-schedule-repository';
import { validateGetDoctorSchedules } from '../validator/get-doctor-schedules-validator';
import { validateGetDoctorSlots } from '../validator/get-doctor-slots-validator';
import { getDoctorSchedulesQuery } from './get-doctor-schedules-query';
import { getDoctorSlotsQuery } from './get-doctor-slots-query';

vi.mock('../repository/doctor-schedule-repository', () => ({
  doctorScheduleRepository: {
    getDoctorSlots: vi.fn(),
    getDoctorSchedules: vi.fn(),
  },
}));
vi.mock('../validator/get-doctor-schedules-validator', () => ({
  validateGetDoctorSchedules: vi.fn(),
}));
vi.mock('../validator/get-doctor-slots-validator', () => ({
  validateGetDoctorSlots: vi.fn(),
}));

const repo = vi.mocked(doctorScheduleRepository);
const validateSchedules = vi.mocked(validateGetDoctorSchedules);
const validateSlots = vi.mocked(validateGetDoctorSlots);
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
const slots = [{ slotDate: '2026-07-15', status: 'Available' as const, rotas: [] }];

describe('DoctorSchedule queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateSchedules.mockReturnValue({
      success: true,
      data: { tenantId: 'tenant-1', doctorId: 2 },
    });
    validateSlots.mockReturnValue({
      success: true,
      data: { tenantId: 'tenant-1', doctorId: 2, slotDate: '2026-07-15' },
    });
    repo.getDoctorSchedules.mockResolvedValue({ data: [schedule], total: 1 });
    repo.getDoctorSlots.mockResolvedValue(slots);
  });

  it('should return validation failure and not call repository for schedule list', async () => {
    validateSchedules.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getDoctorSchedulesQuery({})).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getDoctorSchedules).not.toHaveBeenCalled();
  });

  it('should return validation failure and not call repository for slot list', async () => {
    validateSlots.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getDoctorSlotsQuery({})).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getDoctorSlots).not.toHaveBeenCalled();
  });

  it('should return schedule list data and total', async () => {
    await expect(getDoctorSchedulesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [schedule],
      total: 1,
    });
  });

  it('should return generated slot data', async () => {
    await expect(getDoctorSlotsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: slots,
      total: 1,
    });
    expect(repo.getDoctorSlots).toHaveBeenCalledWith('tenant-1', 2, '2026-07-15');
  });
});
