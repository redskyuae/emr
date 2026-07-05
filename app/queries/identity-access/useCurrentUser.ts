import { useQuery } from '@tanstack/react-query';

import { ApiError, parseApiError } from '@/app/queries/api-error';
import type { MeResponse } from '@/app/api/v1/me/types';

export const currentUserQueryKey = ['current-user'] as const;

export function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

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
    queryFn: fetchCurrentUser,
    queryKey: currentUserQueryKey,
    select: transformCurrentUserResponse,
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 2,
  });
}

export function useHasPermission(permissionName: string) {
  const query = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    select: (response: MeResponse) => response.data.permissions.includes(permissionName),
  });

  return { data: query.data ?? false, isLoading: query.isLoading };
}
