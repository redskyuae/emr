import { beforeEach, describe, expect, it, vi } from 'vitest';

import { therapistScheduleRepository } from '../repository/therapist-schedule-repository';
import { validateGetTherapistSchedules } from '../validator/get-therapist-schedules-validator';
import { getTherapistSchedulesQuery } from './get-therapist-schedules-query';

vi.mock('../repository/therapist-schedule-repository', () => ({
  therapistScheduleRepository: { getTherapistSchedules: vi.fn() },
}));
vi.mock('../validator/get-therapist-schedules-validator', () => ({
  validateGetTherapistSchedules: vi.fn(),
}));

const repo = vi.mocked(therapistScheduleRepository);
const validate = vi.mocked(validateGetTherapistSchedules);

describe('TherapistSchedule queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validate.mockReturnValue({ success: true, data: { tenantId: 'tenant-1', therapistId: 2 } });
    repo.getTherapistSchedules.mockResolvedValue({ data: [], total: 0 });
  });

  it('should not query the repository when validation fails', async () => {
    validate.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getTherapistSchedulesQuery({})).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getTherapistSchedules).not.toHaveBeenCalled();
  });

  it('should return repository data and total', async () => {
    await expect(getTherapistSchedulesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [],
      total: 0,
    });
    expect(repo.getTherapistSchedules).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      therapistId: 2,
    });
  });
});
