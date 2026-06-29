import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetStaffResponse } from '@/app/api/v1/users/[id]/types';
import type { ListStaffResponse } from '@/app/api/v1/users/types';

export type StaffListFilters = {
  page: number;
  limit: number;
  query?: string;
  roleId?: number;
  status?: 'active' | 'inactive';
};

// Prefix key for invalidating every Staff query (list pages + details) after a write.
export const staffBaseKey = ['staff'] as const;
export const staffListQueryKey = (filters: StaffListFilters) => ['staff', 'list', filters] as const;
export const staffDetailQueryKey = (userId: string) => ['staff', 'detail', userId] as const;

function buildStaffListParams(filters: StaffListFilters) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));

  if (filters.query) {
    params.set('query', filters.query);
  }

  if (filters.roleId !== undefined) {
    params.set('roleId', String(filters.roleId));
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  return params.toString();
}

async function fetchStaffList(filters: StaffListFilters): Promise<ListStaffResponse> {
  const response = await fetch(`/api/v1/users?${buildStaffListParams(filters)}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Staff');
  }

  return response.json() as Promise<ListStaffResponse>;
}

export function useStaffQuery(filters: StaffListFilters) {
  return useQuery({
    queryKey: staffListQueryKey(filters),
    queryFn: () => fetchStaffList(filters),
    // Keep the previous page visible while the next page/filter loads, so the
    // table doesn't flash empty on every pagination or filter change.
    placeholderData: keepPreviousData,
  });
}

async function fetchStaffById(userId: string): Promise<GetStaffResponse> {
  const response = await fetch(`/api/v1/users/${userId}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Staff member');
  }

  return response.json() as Promise<GetStaffResponse>;
}

function transformStaffByIdResponse(response: GetStaffResponse) {
  return response.data;
}

export function useStaffByIdQuery(userId: string | null) {
  return useQuery({
    queryKey: staffDetailQueryKey(userId ?? ''),
    queryFn: () => fetchStaffById(userId as string),
    enabled: userId !== null,
    select: transformStaffByIdResponse,
  });
}
