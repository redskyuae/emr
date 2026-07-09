import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitRepository } from '../repository/visit-repository';
import { validateGetVisitById } from '../validator/get-visit-by-id-validator';
import { validateGetVisits } from '../validator/get-visits-validator';
import { getVisitByIdQuery } from './get-visit-by-id-query';
import { getVisitsQuery } from './get-visits-query';

vi.mock('../repository/visit-repository', () => ({
  visitRepository: {
    getVisitById: vi.fn(),
    getVisits: vi.fn(),
  },
}));
vi.mock('../validator/get-visit-by-id-validator', () => ({
  validateGetVisitById: vi.fn(),
}));
vi.mock('../validator/get-visits-validator', () => ({
  validateGetVisits: vi.fn(),
}));

const repo = vi.mocked(visitRepository);
const validateById = vi.mocked(validateGetVisitById);
const validateList = vi.mocked(validateGetVisits);
const visit = {
  id: 100,
  tenantId: 'tenant-1',
  visitNumber: 'VST-1001',
  patientId: 1,
  patient: { id: 1, name: 'Asha Rao', mrn: 'MRN-1001' },
  doctorId: null,
  doctor: null,
  appointmentTypeId: 3,
  appointmentType: { id: 3, name: 'New Consultation', code: 'NEW' },
  appointmentReasonId: null,
  appointmentReason: null,
  statusId: 10,
  status: { id: 10, name: 'Waiting', code: 'WAIT', color: '#6B7280', category: 'WAITING' as const },
  chiefComplaint: null,
  notes: null,
  cancelledReason: null,
  startedOn: null,
  completedOn: null,
  cancelledOn: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('Visit queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateById.mockReturnValue({ success: true, data: { id: 100, tenantId: 'tenant-1' } });
    validateList.mockReturnValue({ success: true, data: { tenantId: 'tenant-1' } });
    repo.getVisitById.mockResolvedValue(visit);
    repo.getVisits.mockResolvedValue({ data: [visit], total: 1 });
  });

  it('should return validation failure and not call repository when id/tenant validation fails', async () => {
    validateById.mockReturnValue({ success: false, errors: ['Invalid'] });
    await expect(getVisitByIdQuery('bad', 'tenant-1')).resolves.toEqual({
      success: false,
      errors: ['Invalid'],
    });
    expect(repo.getVisitById).not.toHaveBeenCalled();
  });

  it('should return single data for get-by-id query', async () => {
    await expect(getVisitByIdQuery('100', 'tenant-1')).resolves.toEqual({
      success: true,
      data: visit,
    });
  });

  it('should return not found when get-by-id repository returns nothing', async () => {
    repo.getVisitById.mockResolvedValue(undefined);
    const result = await getVisitByIdQuery('100', 'tenant-1');
    expect(result).toMatchObject({ success: false, status: 404 });
  });

  it('should return list data and total for list query', async () => {
    await expect(getVisitsQuery({ tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [visit],
      total: 1,
    });
  });

  it('should not call list repository when list validation fails', async () => {
    validateList.mockReturnValue({ success: false, errors: ['Tenant ID cannot be empty'] });
    const result = await getVisitsQuery({ tenantId: '  ' });
    expect(result).toEqual({ success: false, errors: ['Tenant ID cannot be empty'] });
    expect(repo.getVisits).not.toHaveBeenCalled();
  });
});
