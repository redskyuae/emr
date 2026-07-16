import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetPatientChartResponse } from '@/app/api/v1/patients/[id]/chart/types';
import type { PatientChart } from '@/app/api/lib/modules/patient-chart/schemas/patient-chart-schema';

// Patient-scoped key base so a record write invalidates only that Patient's slice.
export const patientChartQueryKey = (patientId: number) =>
  ['patients', 'detail', patientId, 'chart'] as const;

async function fetchPatientChart(patientId: number): Promise<GetPatientChartResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/chart`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load the Patient Chart');
  }

  return response.json() as Promise<GetPatientChartResponse>;
}

function transformPatientChartResponse(response: GetPatientChartResponse): PatientChart {
  return response.data;
}

export function usePatientChartQuery(patientId: number) {
  return useQuery({
    queryKey: patientChartQueryKey(patientId),
    queryFn: () => fetchPatientChart(patientId),
    select: transformPatientChartResponse,
  });
}
