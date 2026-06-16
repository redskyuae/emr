import { eq, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointmentCancelledReasonTable } from '@/app/db/schema/appointment-cancelled-reason';
import { appointmentModeTable } from '@/app/db/schema/appointment-mode';
import { appointmentReasonTable } from '@/app/db/schema/appointment-reason';
import { appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { appointmentTypeTable } from '@/app/db/schema/appointment-type';
import { organization, user } from '@/app/db/schema/auth';

async function findUserByEmail(email: string) {
  const [existingUser] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(sql`lower(${user.email}) = ${email.toLowerCase()}`)
    .limit(1);

  return existingUser;
}

async function deleteTenantArtifacts(tenantId: string) {
  await db.transaction(async (tx) => {
    await tx
      .delete(appointmentCancelledReasonTable)
      .where(eq(appointmentCancelledReasonTable.tenantId, tenantId));
    await tx.delete(appointmentReasonTable).where(eq(appointmentReasonTable.tenantId, tenantId));
    await tx.delete(appointmentStatusTable).where(eq(appointmentStatusTable.tenantId, tenantId));
    await tx.delete(appointmentTypeTable).where(eq(appointmentTypeTable.tenantId, tenantId));
    await tx.delete(appointmentModeTable).where(eq(appointmentModeTable.tenantId, tenantId));
    await tx.delete(organization).where(eq(organization.id, tenantId));
  });
}

async function deleteAuthUser(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
}

export const tenantProvisioningRepository = {
  findUserByEmail,
  deleteTenantArtifacts,
  deleteAuthUser,
};
