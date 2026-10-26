import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchRecentDoctorVisit } from './useRecentDoctorVisit';

function visit(visitDate: string, code: string, treatmentSession: object | null = null) {
  return {
    visitDate,
    visitNumber: `VST-${visitDate}-${code}`,
    visitType: { code },
    treatmentSession,
  };
}

function page(data: object[], totalPages = 1) {
  return {
    ok: true,
    json: async () => ({ data, meta: { totalPages } }),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchRecentDoctorVisit', () => {
  it('should find a completed Doctor Visit within seven Tenant-local calendar days', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        page([
          visit('16-10-2026', 'PROC', { id: 10 }),
          visit('10-10-2026', 'OPD'),
          visit('08-10-2026', 'FUP'),
        ])
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchRecentDoctorVisit(42, '2026-10-16')).resolves.toEqual({
      visitDate: '10-10-2026',
      visitNumber: 'VST-10-10-2026-OPD',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/visits?patientId=42&status=COMPLETED&page=1&limit=100',
      { credentials: 'same-origin' }
    );
  });

  it('should include the seventh day and exclude older consultations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(page([visit('09-10-2026', 'FUP')])));
    await expect(fetchRecentDoctorVisit(42, '2026-10-16')).resolves.toMatchObject({
      visitDate: '09-10-2026',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(page([visit('08-10-2026', 'OPD')])));
    await expect(fetchRecentDoctorVisit(42, '2026-10-16')).resolves.toBeNull();
  });

  it('should skip Therapy Visits and continue through pages of recent Visits', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        page(
          Array.from({ length: 100 }, () => visit('15-10-2026', 'PROC', {})),
          2
        )
      )
      .mockResolvedValueOnce(page([visit('14-10-2026', 'EMER')], 2));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchRecentDoctorVisit(42, '2026-10-16')).resolves.toMatchObject({
      visitDate: '14-10-2026',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should stop when history reaches a date older than the follow-up window', async () => {
    const fetchMock = vi.fn().mockResolvedValue(page([visit('08-10-2026', 'OPD')], 3));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchRecentDoctorVisit(42, '2026-10-16')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
