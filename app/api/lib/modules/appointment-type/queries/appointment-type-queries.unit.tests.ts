import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentTypeRepository } from '../repository/appointment-type-repository';
import { validateGetAppointmentTypeById } from '../validator/get-appointment-type-by-id-validator';
import { validateGetAppointmentTypes } from '../validator/get-appointment-types-validator';
import { getAppointmentTypeByIdQuery } from './get-appointment-type-by-id-query';
import { getAppointmentTypesQuery } from './get-appointment-types-query';

vi.mock('../repository/appointment-type-repository', () => ({
  appointmentTypeRepository: {
    getAppointmentTypeById: vi.fn(),
    getAppointmentTypes: vi.fn(),
  },
}));
vi.mock('../validator/get-appointment-type-by-id-validator', () => ({
  validateGetAppointmentTypeById: vi.fn(),
}));
vi.mock('../validator/get-appointment-types-validator', () => ({
  validateGetAppointmentTypes: vi.fn(),
}));

const repo = vi.mocked(appointmentTypeRepository);
const validateById = vi.mocked(validateGetAppointmentTypeById);
const validateList = vi.mocked(validateGetAppointmentTypes);
const type = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Checkup',
  code: 'CHK',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentType queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: 'tenant-1' });
    repo.getAppointmentTypeById.mockResolvedValue(type);
    repo.getAppointmentTypes.mockResolvedValue({ data: [type], total: 1 });
  });

  it('should return validation failure and not call repository when tenant/id validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'], status: 422 });
    await expect(getAppointmentTypeByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getAppointmentTypeById).not.toHaveBeenCalled();
  });

  it('should call repository with parsed tenant/id/list params on success', async () => {
    await getAppointmentTypeByIdQuery('1', 'tenant-1');
    expect(repo.getAppointmentTypeById).toHaveBeenCalledWith(1, 'tenant-1');
    await getAppointmentTypesQuery({ tenantId: 'tenant-1', page: 2, limit: 5, query: 'chk' });
    expect(repo.getAppointmentTypes).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 2,
      limit: 5,
      query: 'chk',
    });
  });

  it('should return list data and total for list query', async () => {
    await expect(getAppointmentTypesQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [type],
      total: 1,
    });
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getAppointmentTypeByIdQuery('1', 'tenant-1')).resolves.toEqual({
      success: true,
      data: type,
    });
  });

  it('should preserve failure status where existing query/validator behavior includes it', async () => {
    repo.getAppointmentTypeById.mockResolvedValue(undefined);
    const result = await getAppointmentTypeByIdQuery('1', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });
});
