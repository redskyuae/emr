import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import { validateGetAppointmentCancelledReasonById } from '../validator/get-appointment-cancelled-reason-by-id-validator';
import { validateGetAppointmentCancelledReasons } from '../validator/get-appointment-cancelled-reasons-validator';
import { getAppointmentCancelledReasonByIdQuery } from './get-appointment-cancelled-reason-by-id-query';
import { getAppointmentCancelledReasonsQuery } from './get-appointment-cancelled-reasons-query';

vi.mock('../repository/appointment-cancelled-reason-repository', () => ({
  appointmentCancelledReasonRepository: {
    getAppointmentCancelledReasonById: vi.fn(),
    getAppointmentCancelledReasons: vi.fn(),
  },
}));
vi.mock('../validator/get-appointment-cancelled-reason-by-id-validator', () => ({
  validateGetAppointmentCancelledReasonById: vi.fn(),
}));
vi.mock('../validator/get-appointment-cancelled-reasons-validator', () => ({
  validateGetAppointmentCancelledReasons: vi.fn(),
}));

const repo = vi.mocked(appointmentCancelledReasonRepository);
const validateById = vi.mocked(validateGetAppointmentCancelledReasonById);
const validateList = vi.mocked(validateGetAppointmentCancelledReasons);
const reason = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Cancelled',
  code: 'CX',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentCancelledReason queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAppointmentCancelledReasonById.mockResolvedValue(reason);
    repo.getAppointmentCancelledReasons.mockResolvedValue({ data: [reason], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getAppointmentCancelledReasonByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAppointmentCancelledReasonById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAppointmentCancelledReasonByIdQuery('1', 'tenant-1');
    expect(repo.getAppointmentCancelledReasonById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAppointmentCancelledReasonsQuery({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'cx',
    });
    expect(repo.getAppointmentCancelledReasons).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'cx',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAppointmentCancelledReasonsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [reason],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAppointmentCancelledReasonByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: reason,
    });
  });

  it('should preserve failure status where existing query/validator behavior includes it', async () => {
    repo.getAppointmentCancelledReasonById.mockResolvedValue(undefined);
    const result = await getAppointmentCancelledReasonByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
