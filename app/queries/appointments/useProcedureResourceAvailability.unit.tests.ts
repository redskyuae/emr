import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GetProcedureResourceAvailabilityResponse } from '@/app/api/v1/appointments/resource-availability/types';

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-query', () => ({ useQuery: useQueryMock }));

import {
  procedureResourceAvailabilityQueryKey,
  useProcedureResourceAvailabilityQuery,
} from './useProcedureResourceAvailability';

const params = {
  slotDate: '31-12-2099',
  startTime: '10:00',
  endTime: '11:00',
  patientId: '12',
};

type CapturedQueryOptions = {
  enabled: boolean;
  queryKey: ReturnType<typeof procedureResourceAvailabilityQueryKey>;
  queryFn: () => Promise<GetProcedureResourceAvailabilityResponse>;
  refetchInterval: number | false;
  refetchOnWindowFocus: 'always';
  select: (
    response: GetProcedureResourceAvailabilityResponse
  ) => GetProcedureResourceAvailabilityResponse['data'];
};

function capturedQueryOptions() {
  const options = useQueryMock.mock.calls.at(-1)?.[0] as CapturedQueryOptions | undefined;

  if (!options) throw new Error('Expected useQuery to be called');

  return options;
}

describe('Procedure resource availability query', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('should poll and refetch on focus while resource allocation is active', () => {
    useProcedureResourceAvailabilityQuery(params, { enabled: true });

    expect(capturedQueryOptions()).toMatchObject({
      enabled: true,
      refetchInterval: 15_000,
      refetchOnWindowFocus: 'always',
    });
  });

  it('should not poll while resource allocation is inactive', () => {
    useProcedureResourceAvailabilityQuery(params, { enabled: false });

    expect(capturedQueryOptions()).toMatchObject({ enabled: false, refetchInterval: false });
  });

  it('should fetch with same-origin credentials and expose availability data', async () => {
    const response: GetProcedureResourceAvailabilityResponse = {
      data: { roomIds: [4], therapistIds: [8], patientUnavailable: false },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    });
    vi.stubGlobal('fetch', fetchMock);

    useProcedureResourceAvailabilityQuery(params, { enabled: true });
    const options = capturedQueryOptions();

    await expect(options.queryFn()).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/appointments/resource-availability?slotDate=31-12-2099&startTime=10%3A00&endTime=11%3A00&patientId=12',
      { credentials: 'same-origin' }
    );
    expect(options.select(response)).toBe(response.data);
  });
});
