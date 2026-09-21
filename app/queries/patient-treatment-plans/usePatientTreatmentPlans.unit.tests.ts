import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ListPatientTreatmentPlansResponse } from '@/app/api/v1/patients/[id]/treatment-plans/types';

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-query', () => ({ useQuery: useQueryMock }));

import {
  patientTreatmentPlansQueryKey,
  usePatientTreatmentPlansQuery,
} from './usePatientTreatmentPlans';

type CapturedQueryOptions = {
  enabled: boolean;
  queryKey: ReturnType<typeof patientTreatmentPlansQueryKey>;
  queryFn: () => Promise<ListPatientTreatmentPlansResponse>;
  select: (
    response: ListPatientTreatmentPlansResponse
  ) => ListPatientTreatmentPlansResponse['data'];
};

function capturedQueryOptions() {
  const options = useQueryMock.mock.calls.at(-1)?.[0] as CapturedQueryOptions | undefined;

  if (!options) throw new Error('Expected useQuery to be called');

  return options;
}

describe('Patient Treatment Plan query', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('should use the stable current-Plan query key', () => {
    expect(patientTreatmentPlansQueryKey(42)).toEqual([
      'patients',
      42,
      'treatment-plans',
      { status: 'current' },
    ]);
  });

  it.each([
    {
      label: 'no selected Patient',
      patientId: null,
      registrationStatus: null,
      bookingPath: 'PROCEDURE' as const,
    },
    {
      label: 'a provisional Patient',
      patientId: 42,
      registrationStatus: 'provisional' as const,
      bookingPath: 'PROCEDURE' as const,
    },
    {
      label: 'the Consultation path',
      patientId: 42,
      registrationStatus: 'registered' as const,
      bookingPath: 'CONSULTATION' as const,
    },
  ])('should stay disabled for $label', ({ patientId, registrationStatus, bookingPath }) => {
    usePatientTreatmentPlansQuery({ patientId, registrationStatus, bookingPath });

    expect(capturedQueryOptions().enabled).toBe(false);
  });

  it('should fetch current Plans with same-origin credentials and expose the Plan list', async () => {
    const response: ListPatientTreatmentPlansResponse = { data: [] };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    });
    vi.stubGlobal('fetch', fetchMock);

    usePatientTreatmentPlansQuery({
      patientId: 42,
      registrationStatus: 'registered',
      bookingPath: 'PROCEDURE',
    });
    const options = capturedQueryOptions();

    expect(options.enabled).toBe(true);
    await expect(options.queryFn()).resolves.toBe(response);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/patients/42/treatment-plans?status=current', {
      credentials: 'same-origin',
    });
    expect(options.select(response)).toBe(response.data);
  });
});
