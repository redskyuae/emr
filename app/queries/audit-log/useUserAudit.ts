import { useQuery } from '@tanstack/react-query';

import type { ListUserAuditResponse } from '@/app/api/v1/audit-log/users/types';
import type { GetUserAuditResponse } from '@/app/api/v1/audit-log/users/[userId]/types';
import { parseApiError } from '@/app/queries/api-error';

import { auditSearchParams } from './audit-search-params';

type UserAuditRangeParams = { fromDate?: string; toDate?: string };

type UserAuditListParams = UserAuditRangeParams & {
  query?: string;
  page?: number;
  limit?: number;
};

const USER_AUDIT_KEY = ['user-audit'] as const;

async function fetchUserAuditList(params: UserAuditListParams): Promise<ListUserAuditResponse> {
  const response = await fetch(`/api/v1/audit-log/users?${auditSearchParams(params)}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load User Audit');
  }

  return response.json() as Promise<ListUserAuditResponse>;
}

async function fetchUserAudit(
  userId: string,
  params: UserAuditRangeParams
): Promise<GetUserAuditResponse> {
  const response = await fetch(
    `/api/v1/audit-log/users/${encodeURIComponent(userId)}?${auditSearchParams(params)}`,
    { credentials: 'same-origin' }
  );

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load this user’s audit');
  }

  return response.json() as Promise<GetUserAuditResponse>;
}

// Non-suspense: changing a filter must not blow away the toolbar around the list.
export function useUserAuditListQuery(params: UserAuditListParams) {
  return useQuery({
    queryKey: [...USER_AUDIT_KEY, 'list', params],
    queryFn: () => fetchUserAuditList(params),
  });
}

export function useUserAuditQuery(userId: string, params: UserAuditRangeParams) {
  return useQuery({
    queryKey: [...USER_AUDIT_KEY, 'detail', userId, params],
    queryFn: () => fetchUserAudit(userId, params),
    select: (response) => response.data,
  });
}
