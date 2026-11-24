import { and, count, eq, gte } from 'drizzle-orm';

import { db } from '@/app/db';
import { auditEvent as auditEventTable } from '@/app/db/schema/audit-event';

/** How many failed sign-ins were recorded against this user in this Tenant since an instant. */
async function countFailedSignInsSince(
  tenantId: string,
  userId: string,
  since: Date
): Promise<number> {
  // Served by the (tenant_id, actor_user_id, occurred_on) index.
  const [row] = await db
    .select({ total: count() })
    .from(auditEventTable)
    .where(
      and(
        eq(auditEventTable.tenantId, tenantId),
        eq(auditEventTable.actorUserId, userId),
        eq(auditEventTable.action, 'auth.sign-in-failed'),
        gte(auditEventTable.occurredOn, since)
      )
    );

  return row?.total ?? 0;
}

export const failedSignInRepository = {
  countFailedSignInsSince,
};
