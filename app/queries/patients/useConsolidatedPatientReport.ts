import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetConsolidatedPatientReportResponse } from '@/app/api/v1/patients/[id]/consolidated-report/types';

/** Dates are `DD-MM-YYYY`, as the API takes them. */
type ConsolidatedPatientReportCriteria = {
  toDate: string;
  fromDate: string;
  patientId: number;
};

const consolidatedPatientReportQueryKey = ({
  toDate,
  fromDate,
  patientId,
}: ConsolidatedPatientReportCriteria) =>
  ['patients', 'detail', patientId, 'consolidated-report', fromDate, toDate] as const;

async function fetchConsolidatedPatientReport({
  toDate,
  fromDate,
  patientId,
}: ConsolidatedPatientReportCriteria): Promise<GetConsolidatedPatientReportResponse> {
  const params = new URLSearchParams({ fromDate, toDate });
  const response = await fetch(`/api/v1/patients/${patientId}/consolidated-report?${params}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not generate the Consolidated Patient Report');
  }

  return response.json() as Promise<GetConsolidatedPatientReportResponse>;
}

function transformConsolidatedPatientReportResponse(
  response: GetConsolidatedPatientReportResponse
) {
  return response.data;
}

/** Reads the report once criteria are chosen; `null` criteria leave it idle. */
export function useConsolidatedPatientReportQuery(
  criteria: ConsolidatedPatientReportCriteria | null
) {
  return useQuery({
    queryKey: consolidatedPatientReportQueryKey(
      criteria ?? { patientId: -1, fromDate: '', toDate: '' }
    ),
    queryFn: () => fetchConsolidatedPatientReport(criteria as ConsolidatedPatientReportCriteria),
    enabled: criteria !== null,
    select: transformConsolidatedPatientReportResponse,
  });
}
