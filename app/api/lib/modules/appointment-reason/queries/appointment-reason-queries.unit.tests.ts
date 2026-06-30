import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentReasonRepository } from '../repository/appointment-reason-repository';
import { validateGetAppointmentReasonById } from '../validator/get-appointment-reason-by-id-validator';
import { validateGetAppointmentReasons } from '../validator/get-appointment-reasons-validator';
import { getAppointmentReasonByIdQuery } from './get-appointment-reason-by-id-query';
import { getAppointmentReasonsQuery } from './get-appointment-reasons-query';

vi.mock('../repository/appointment-reason-repository', () => ({
  appointmentReasonRepository: {
    getAppointmentReasonById: vi.fn(),
    getAppointmentReasons: vi.fn(),
  },
}));
vi.mock('../validator/get-appointment-reason-by-id-validator', () => ({
  validateGetAppointmentReasonById: vi.fn(),
}));
vi.mock('../validator/get-appointment-reasons-validator', () => ({
  validateGetAppointmentReasons: vi.fn(),
}));

const repo = vi.mocked(appointmentReasonRepository);
const validateById = vi.mocked(validateGetAppointmentReasonById);
const validateList = vi.mocked(validateGetAppointmentReasons);
const reason = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Checkup',
  code: 'CHK',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentReason queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAppointmentReasonById.mockResolvedValue(reason);
    repo.getAppointmentReasons.mockResolvedValue({ data: [reason], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getAppointmentReasonByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAppointmentReasonById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAppointmentReasonByIdQuery('1', 'tenant-1');
    expect(repo.getAppointmentReasonById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAppointmentReasonsQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'con' });
    expect(repo.getAppointmentReasons).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'con',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAppointmentReasonsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [reason],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAppointmentReasonByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: reason,
    });
  });

  it('should preserve failure status where existing query/validator behavior includes it', async () => {
    repo.getAppointmentReasonById.mockResolvedValue(undefined);
    const result = await getAppointmentReasonByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
