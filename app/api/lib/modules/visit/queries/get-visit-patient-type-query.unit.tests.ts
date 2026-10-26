import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { visitRepository } from '../repository/visit-repository';
import { validateGetVisitPatientType } from '../validator/get-visit-patient-type-validator';
import { getVisitPatientTypeQuery } from './get-visit-patient-type-query';

vi.mock('../validator/get-visit-patient-type-validator', () => ({
  validateGetVisitPatientType: vi.fn(),
}));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));
vi.mock('../repository/visit-repository', () => ({
  visitRepository: { findLatestCompletedVisitForPatient: vi.fn() },
}));

describe('getVisitPatientTypeQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-19T10:00:00.000Z'));
    vi.mocked(validateGetVisitPatientType).mockResolvedValue({
      success: true,
      data: { id: 7, createdOn: new Date('2025-01-01T10:00:00.000Z') } as never,
    });
    vi.mocked(tenantRepository.getTenantById).mockResolvedValue({
      timeZone: 'Asia/Kolkata',
    } as never);
  });
  afterEach(() => vi.useRealTimers());

  it('classifies as New with no completed Visit since registration', async () => {
    vi.mocked(visitRepository.findLatestCompletedVisitForPatient).mockResolvedValue(undefined);
    const result = await getVisitPatientTypeQuery('7', 'tenant-1');
    expect(result).toMatchObject({
      success: true,
      data: {
        patientType: 'NEW',
        patientRecordDate: '2025-01-01',
        lookbackStartDate: '2023-10-19',
        lastCompletedVisit: null,
      },
    });
    expect(visitRepository.findLatestCompletedVisitForPatient).toHaveBeenCalledWith(
      'tenant-1',
      7,
      '2025-01-01',
      '2026-10-19'
    );
  });

  it('classifies as Established with a completed Visit in the three-year window', async () => {
    vi.mocked(visitRepository.findLatestCompletedVisitForPatient).mockResolvedValue({
      visitNumber: 'VIS-42',
      visitDate: '2024-10-19',
    });
    expect(await getVisitPatientTypeQuery('7', 'tenant-1')).toMatchObject({
      success: true,
      data: {
        patientType: 'ESTABLISHED',
        lastCompletedVisit: { visitNumber: 'VIS-42', visitDate: '19-10-2024' },
      },
    });
  });

  it('uses the three-year cutoff when registration is older', async () => {
    vi.mocked(validateGetVisitPatientType).mockResolvedValue({
      success: true,
      data: { id: 7, createdOn: new Date('2019-01-01T00:00:00.000Z') } as never,
    });
    vi.mocked(visitRepository.findLatestCompletedVisitForPatient).mockResolvedValue(undefined);
    await getVisitPatientTypeQuery('7', 'tenant-1');
    expect(visitRepository.findLatestCompletedVisitForPatient).toHaveBeenCalledWith(
      'tenant-1',
      7,
      '2023-10-19',
      '2026-10-19'
    );
  });
});
