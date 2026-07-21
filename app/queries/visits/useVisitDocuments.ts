import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListVisitDocumentsResponse } from '@/app/api/v1/visits/[id]/documents/types';

export const visitDocumentsQueryKey = (visitId: number) =>
  ['visits', 'documents', visitId] as const;

async function fetchVisitDocuments(visitId: number): Promise<ListVisitDocumentsResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}/documents`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Visit documents');
  }

  return response.json() as Promise<ListVisitDocumentsResponse>;
}

function transformVisitDocumentsResponse(response: ListVisitDocumentsResponse) {
  return response.data;
}

export function useVisitDocumentsQuery(visitId: number) {
  return useQuery({
    queryKey: visitDocumentsQueryKey(visitId),
    queryFn: () => fetchVisitDocuments(visitId),
    select: transformVisitDocumentsResponse,
  });
}
