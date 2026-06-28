import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { MeResponse } from '@/app/api/v1/me/types';

export const currentUserQueryKey = ['current-user'] as const;

async function fetchCurrentUser(): Promise<MeResponse> {
  const response = await fetch('/api/v1/me', { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load your profile');
  }

  return response.json() as Promise<MeResponse>;
}

function transformCurrentUserResponse(response: MeResponse) {
  return response.data;
}

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    select: transformCurrentUserResponse,
  });
}

// Subscribes to the same Current User cache with a permission-specific `select`,
// so a consumer re-renders only when this permission's result flips. Default-deny:
// `data` is false while loading or on error. Owner/Admin receive the full
// Permission Catalogue from /me, so they pass every check.
export function useHasPermission(permissionName: string) {
  const query = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    select: (response: MeResponse) => response.data.permissions.includes(permissionName),
  });

  return { data: query.data ?? false, isLoading: query.isLoading };
}
