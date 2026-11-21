import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';

type SignupFailureKind = AnalyticsEventProperties<'signup_failed'>['failure_kind'];

/** Classifies a rejected signup by its status alone, never by the message. */
export function signupFailureKind(status: number | undefined): SignupFailureKind {
  if (status === 400 || status === 422) {
    return 'validation';
  }

  return status === 409 ? 'conflict' : 'other';
}
