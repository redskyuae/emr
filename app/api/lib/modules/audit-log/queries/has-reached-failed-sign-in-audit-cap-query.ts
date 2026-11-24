import { failedSignInRepository } from '../repository/failed-sign-in-repository';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';

// Repeated wrong passwords against one staff email must not write without bound to
// an append-only table: past this many failed sign-ins in the window, further
// attempts against that user in that Tenant are not recorded.
const FAILED_SIGN_IN_AUDIT_CAP = 10;
const FAILED_SIGN_IN_AUDIT_WINDOW_MS = 15 * 60 * 1000;

/** True when this user already has the most failed sign-ins the Audit Log records per window. */
export async function hasReachedFailedSignInAuditCapQuery(
  tenantId: string,
  userId: string,
  now: Date = new Date()
): Promise<SingleQueryResult<boolean>> {
  const since = new Date(now.getTime() - FAILED_SIGN_IN_AUDIT_WINDOW_MS);
  const recorded = await failedSignInRepository.countFailedSignInsSince(tenantId, userId, since);

  return { success: true, data: recorded >= FAILED_SIGN_IN_AUDIT_CAP };
}
