import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentModeRepository } from '../repository/appointment-mode-repository';
import { validateGetAppointmentModeById } from '../validator/get-appointment-mode-by-id-validator';
import { validateGetAppointmentModes } from '../validator/get-appointment-modes-validator';
import { getAppointmentModeByIdQuery } from './get-appointment-mode-by-id-query';
import { getAppointmentModesQuery } from './get-appointment-modes-query';

vi.mock('../repository/appointment-mode-repository', () => ({
  appointmentModeRepository: { getAppointmentModeById: vi.fn(), getAppointmentModes: vi.fn() },
}));
vi.mock('../validator/get-appointment-mode-by-id-validator', () => ({
  validateGetAppointmentModeById: vi.fn(),
}));
vi.mock('../validator/get-appointment-modes-validator', () => ({
  validateGetAppointmentModes: vi.fn(),
}));

const repo = vi.mocked(appointmentModeRepository);
const validateById = vi.mocked(validateGetAppointmentModeById);
const validateList = vi.mocked(validateGetAppointmentModes);
const mode = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'In Person',
  code: 'IP',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentMode queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAppointmentModeById.mockResolvedValue(mode);
    repo.getAppointmentModes.mockResolvedValue({ data: [mode], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getAppointmentModeByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAppointmentModeById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAppointmentModeByIdQuery('1', 'tenant-1');
    expect(repo.getAppointmentModeById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAppointmentModesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'vid' });
    expect(repo.getAppointmentModes).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'vid',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAppointmentModesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [mode],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAppointmentModeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: mode,
    });
  });

  it('should preserve failure status where existing query/validator behavior includes it', async () => {
    repo.getAppointmentModeById.mockResolvedValue(undefined);
    const result = await getAppointmentModeByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
