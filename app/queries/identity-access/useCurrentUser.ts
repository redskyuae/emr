import { type QueryClient, useQuery } from '@tanstack/react-query';

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  getHomePathForUser,
  hasDoctorRole,
} from '@/app/lib/auth-route-guards';
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

/**
 * Resolves the signed-in user's home page and primes the Current User cache for the app shell.
 * Fetches fresh so a previous user's cached profile is never used; falls back to the dashboard
 * if the profile cannot be loaded, where the app shell shows its own error.
 */
export async function fetchCurrentUserHomePath(queryClient: QueryClient): Promise<string> {
  try {
    const response = await queryClient.fetchQuery({
      queryKey: currentUserQueryKey,
      queryFn: fetchCurrentUser,
      staleTime: 0,
    });

    return getHomePathForUser(response.data);
  } catch {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }
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

  return { data: query.data ?? false, isLoading: query.isLoading, isError: query.isError };
}

type DoctorScope = { isDoctor: false } | { isDoctor: true; doctorId: number | null };

function toDoctorScope(response: MeResponse): DoctorScope {
  const { roles, user } = response.data;

  return hasDoctorRole(roles)
    ? { isDoctor: true, doctorId: user.doctorProfile?.id ?? null }
    : { isDoctor: false };
}

/**
 * Which Visits the Current User works: a user with the Doctor Role sees only the Visits of
 * their own Doctor record (`doctorId` is null when no Doctor is linked to them); anyone else
 * sees every Visit. `data` is undefined while the Current User loads.
 */
export function useDoctorScope() {
  const query = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    select: toDoctorScope,
  });

  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}
