import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';

type SignInFailureKind = AnalyticsEventProperties<'sign_in_failed'>['failure_kind'];

/**
 * Classifies a rejected sign-in by its status alone, never by the message, which can repeat what
 * was typed. The sign-in route answers 401 for a wrong email or password, 403 when the user has no
 * Active Tenant and 409 when they have several and must choose.
 */
export function signInFailureKind(status: number | undefined): SignInFailureKind {
  switch (status) {
    case 401:
      return 'invalid_credentials';
    case 403:
      return 'no_active_tenant';
    case 409:
      return 'multiple_active_tenants';
    default:
      return 'other';
  }
}
