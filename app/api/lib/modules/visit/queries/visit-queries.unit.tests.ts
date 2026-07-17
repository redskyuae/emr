import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateGetVisitById } from '../validator/get-visit-by-id-validator';
import { getVisitByIdQuery } from './get-visit-by-id-query';
import { getVisitsQuery } from './get-visits-query';

vi.mock('../repository/visit-repository', () => ({
  visitRepository: { getVisitById: vi.fn(), getVisits: vi.fn() },
}));
vi.mock('../validator/get-visit-by-id-validator', () => ({ validateGetVisitById: vi.fn() }));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));

const repo = vi.mocked(visitRepository);
const tenantRepo = vi.mocked(tenantRepository);
const validateById = vi.mocked(validateGetVisitById);

const visit = { id: 1, visitNumber: 'VST-1001', status: 'CHECKED_IN' } as Visit;

describe('Visit queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T04:30:00Z'));
    validateById.mockReturnValue({ success: true, data: { id: 1, tenantId: 'tenant-1' } });
    repo.getVisitById.mockResolvedValue(visit);
    repo.getVisits.mockResolvedValue({ data: [visit], total: 1 });
    tenantRepo.getTenantById.mockResolvedValue({
      id: 'tenant-1',
      timeZone: 'Asia/Kolkata',
    } as never);
  });

  describe('getVisitByIdQuery', () => {
    it('should short-circuit and not call the repository when validation fails', async () => {
      validateById.mockReturnValue({ success: false, errors: ['Visit abc is Invalid.'] });

      await expect(getVisitByIdQuery('abc', 'tenant-1')).resolves.toEqual({
        success: false,
        errors: ['Visit abc is Invalid.'],
      });
      expect(repo.getVisitById).not.toHaveBeenCalled();
    });

    it('should return not found when the visit is missing', async () => {
      repo.getVisitById.mockResolvedValue(undefined);

      await expect(getVisitByIdQuery('1', 'tenant-1')).resolves.toMatchObject({
        success: false,
        status: 404,
      });
    });

    it('should return the visit on success', async () => {
      await expect(getVisitByIdQuery('1', 'tenant-1')).resolves.toEqual({
        success: true,
        data: visit,
      });
    });
  });

  describe('getVisitsQuery', () => {
    it('should short-circuit and not call the repository when the tenant is blank', async () => {
      const result = await getVisitsQuery({ tenantId: '  ' });

      expect(result.success).toBe(false);
      expect(repo.getVisits).not.toHaveBeenCalled();
    });

    it('should default to the tenant local today when no date or patient filter is given', async () => {
      await getVisitsQuery({ tenantId: 'tenant-1', filters: {} });

      expect(repo.getVisits).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        visitDate: '2026-07-16',
      });
    });

    it('should not default the date when listing one patient history', async () => {
      await getVisitsQuery({ tenantId: 'tenant-1', filters: { patientId: 7 } });

      expect(repo.getVisits).toHaveBeenCalledWith({ tenantId: 'tenant-1', patientId: 7 });
      expect(tenantRepo.getTenantById).not.toHaveBeenCalled();
    });

    it('should respect an explicit visit date filter', async () => {
      await getVisitsQuery({ tenantId: 'tenant-1', filters: { visitDate: '15-07-2026' } });

      expect(repo.getVisits).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        visitDate: '2026-07-15',
      });
    });

    it('should pass filters and paging through to the repository', async () => {
      await getVisitsQuery({
        tenantId: 'tenant-1',
        filters: {
          visitDate: '16-07-2026',
          doctorId: 3,
          status: 'CHECKED_IN',
          page: 2,
          limit: 5,
          query: 'rao',
        },
      });

      expect(repo.getVisits).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        visitDate: '2026-07-16',
        doctorId: 3,
        status: 'CHECKED_IN',
        page: 2,
        limit: 5,
        query: 'rao',
      });
    });

    it('should not default the date when the tenant cannot be read', async () => {
      tenantRepo.getTenantById.mockResolvedValue(undefined);

      await getVisitsQuery({ tenantId: 'tenant-1', filters: {} });

      expect(repo.getVisits).toHaveBeenCalledWith({ tenantId: 'tenant-1' });
    });

    it('should return the list query result shape', async () => {
      await expect(getVisitsQuery({ tenantId: 'tenant-1', filters: {} })).resolves.toEqual({
        success: true,
        data: [visit],
        total: 1,
      });
    });
  });
});
