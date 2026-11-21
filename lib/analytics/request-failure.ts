// Turns a failed API request into the properties of `action_rejected` or `data_load_failed`: the
// cleaned API route, the status and the kind of rejection. The error's message is never read, as
// it can repeat submitted values.

import { ApiError } from '@/app/queries/api-error';

export const REJECTION_KINDS = [
  'validation',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'server_error',
  'network',
  'other',
] as const;

type RejectionKind = (typeof REJECTION_KINDS)[number];

type RequestFailure = { api_route?: string; status?: number; rejection_kind: RejectionKind };

/** React Query mutation `meta` for hooks whose failures are counted by their own event. */
export const SKIP_FAILURE_ANALYTICS = { skipFailureAnalytics: true } as const;

function rejectionKindForStatus(status: number): RejectionKind {
  if (status >= 500) return 'server_error';

  switch (status) {
    case 400:
    case 422:
      return 'validation';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    default:
      return 'other';
  }
}

const VERSION = /^v\d+$/;
const STATIC_SEGMENT = /^[a-z][a-z-]*$/;

/**
 * `https://emr.example/api/v1/users/aB3xY9/roles/4?x=1` → `/api/v1/users/:id/roles/:id`. Every API
 * path segment that is not a lowercase word (or the version) is a record id: numbers, UUIDs and
 * the auth layer's random string ids alike. Anything that is not an `/api/` address is dropped.
 */
function apiRouteFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  let pathname: string;

  try {
    pathname = new URL(url, 'http://localhost').pathname;
  } catch {
    return undefined;
  }

  if (!pathname.startsWith('/api/')) return undefined;

  return pathname
    .split('/')
    .map((segment) =>
      segment === '' || VERSION.test(segment) || STATIC_SEGMENT.test(segment) ? segment : ':id'
    )
    .join('/');
}

function isNetworkFailure(error: unknown) {
  return (
    error instanceof TypeError || (error instanceof DOMException && error.name === 'TimeoutError')
  );
}

/**
 * What to record about a failed request, or `null` when nothing should be: a 401 (the Session
 * expired, which is recorded as `signed_out`), a request the user cancelled, and errors that are
 * not API rejections at all.
 */
export function describeRequestFailure(error: unknown): RequestFailure | null {
  if (error instanceof ApiError) {
    if (error.status === undefined) {
      return { api_route: apiRouteFromUrl(error.url), rejection_kind: 'other' };
    }

    if (error.status === 401) return null;

    return {
      api_route: apiRouteFromUrl(error.url),
      status: error.status,
      rejection_kind: rejectionKindForStatus(error.status),
    };
  }

  return isNetworkFailure(error) ? { rejection_kind: 'network' } : null;
}
