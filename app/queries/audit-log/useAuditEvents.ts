import { useQuery } from '@tanstack/react-query';

import type {
  AuditModule,
  AuditOperation,
} from '@/app/api/lib/modules/audit-log/schemas/audit-action-catalogue';
import type { ListAuditEventsResponse } from '@/app/api/v1/audit-log/types';
import { parseApiError } from '@/app/queries/api-error';

export type AuditEventsParams = {
  fromDate?: string;
  toDate?: string;
  module?: AuditModule;
  operation?: AuditOperation;
  query?: string;
  patientId?: number;
  visitId?: number;
  actorUserId?: string;
  sessionId?: string;
  page?: number;
  limit?: number;
};

const AUDIT_EVENTS_KEY = ['audit-events'] as const;

/** The query string both the list and the export accept; paging is ignored by the export. */
export function auditEventsSearchParams(params: AuditEventsParams) {
  const searchParams = new URLSearchParams();

  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') searchParams.set(name, String(value));
  }

  return searchParams;
}

async function fetchAuditEvents(params: AuditEventsParams): Promise<ListAuditEventsResponse> {
  const response = await fetch(`/api/v1/audit-log?${auditEventsSearchParams(params)}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load the Audit Log');
  }

  return response.json() as Promise<ListAuditEventsResponse>;
}

// Non-suspense: changing a filter must not blow away the toolbar around the list.
export function useAuditEventsQuery(params: AuditEventsParams) {
  return useQuery({
    queryKey: [...AUDIT_EVENTS_KEY, params],
    queryFn: () => fetchAuditEvents(params),
  });
}
