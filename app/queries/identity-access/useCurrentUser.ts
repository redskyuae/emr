import { useQuery } from '@tanstack/react-query';

import { ApiError, parseApiError } from '@/app/queries/api-error';
import type { MeResponse } from '@/app/api/v1/me/types';

export const currentUserQueryKey = ['current-user'] as const;

// `/me` must always settle: a bare fetch can stall indefinitely and leave the
// AppShellGate stuck in its loading phase with no error screen or retry path.
const CURRENT_USER_TIMEOUT_MS = 15_000;

// Retrying either of these will never self-heal, so we skip React Query's retries.
// A 401 means the Session is gone; a 403 means it is valid but unusable here
// (e.g. no active Tenant selected).
export function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

// Only a 401 warrants redirecting to /login. A 403 (authenticated but no active
// Tenant) must NOT redirect, or the `(auth)` layout bounces the live Session
// back into the app and we loop; it surfaces as the branded error screen instead.
export function isSessionExpiredError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

async function fetchCurrentUser(): Promise<MeResponse> {
  const response = await fetch('/api/v1/me', {
    credentials: 'same-origin',
    signal: AbortSignal.timeout(CURRENT_USER_TIMEOUT_MS),
  });

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

// Subscribes to the same Current User cache with a permission-specific `select`,
// so a consumer re-renders only when this permission's result flips. Default-deny:
// `data` is false while loading or on error.
export function useHasPermission(permissionName: string) {
  const query = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    select: (response: MeResponse) => response.data.permissions.includes(permissionName),
  });

  return { data: query.data ?? false, isLoading: query.isLoading };
}
