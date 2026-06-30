import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentStatusRepository } from '../repository/appointment-status-repository';
import { validateGetAppointmentStatusById } from '../validator/get-appointment-status-by-id-validator';
import { validateGetAppointmentStatuses } from '../validator/get-appointment-statuses-validator';
import { getAppointmentStatusByIdQuery } from './get-appointment-status-by-id-query';
import { getAppointmentStatusesQuery } from './get-appointment-statuses-query';

vi.mock('../repository/appointment-status-repository', () => ({
  appointmentStatusRepository: {
    getAppointmentStatusById: vi.fn(),
    getAppointmentStatuses: vi.fn(),
  },
}));
vi.mock('../validator/get-appointment-status-by-id-validator', () => ({
  validateGetAppointmentStatusById: vi.fn(),
}));
vi.mock('../validator/get-appointment-statuses-validator', () => ({
  validateGetAppointmentStatuses: vi.fn(),
}));

const repo = appointmentStatusRepository as typeof appointmentStatusRepository & {
  getAppointmentStatusById: Mock<typeof appointmentStatusRepository.getAppointmentStatusById>;
  getAppointmentStatuses: Mock<typeof appointmentStatusRepository.getAppointmentStatuses>;
};
const validateById = validateGetAppointmentStatusById as Mock<
  typeof validateGetAppointmentStatusById
>;
const validateList = validateGetAppointmentStatuses as Mock<typeof validateGetAppointmentStatuses>;
const status = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Scheduled',
  code: 'SCH',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentStatus queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAppointmentStatusById.mockResolvedValue(status);
    repo.getAppointmentStatuses.mockResolvedValue({ data: [status], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'], status: 422 });
    await expect(getAppointmentStatusByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAppointmentStatusById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAppointmentStatusByIdQuery('1', 'tenant-1');
    expect(repo.getAppointmentStatusById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAppointmentStatusesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'sch' });
    expect(repo.getAppointmentStatuses).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'sch',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAppointmentStatusesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [status],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAppointmentStatusByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: status,
    });
  });

  it('should preserve failure status where existing query/validator behavior includes it', async () => {
    repo.getAppointmentStatusById.mockResolvedValue(undefined);
    const result = await getAppointmentStatusByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
