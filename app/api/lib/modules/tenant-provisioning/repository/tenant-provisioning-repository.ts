import { eq, sql } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

import { db } from '@/app/db';
import { appointmentCancelledReason as appointmentCancelledReasonTable } from '@/app/db/schema/appointment-cancelled-reason';
import { appointmentMode as appointmentModeTable } from '@/app/db/schema/appointment-mode';
import { appointmentReason as appointmentReasonTable } from '@/app/db/schema/appointment-reason';
import { appointmentStatus as appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { appointmentType as appointmentTypeTable } from '@/app/db/schema/appointment-type';
import { assetCategory as assetCategoryTable } from '@/app/db/schema/asset-category';
import { assetCondition as assetConditionTable } from '@/app/db/schema/asset-condition';
import { assetStatus as assetStatusTable } from '@/app/db/schema/asset-status';
import { asset as assetTable } from '@/app/db/schema/asset';
import { allergen as allergenTable } from '@/app/db/schema/allergen';
import { clinicalNoteType as clinicalNoteTypeTable } from '@/app/db/schema/clinical-note-type';
import { diagnosisCode as diagnosisCodeTable } from '@/app/db/schema/diagnosis-code';
import { organization, user } from '@/app/db/schema/auth';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import {
  workOrderCodeCounter as workOrderCodeCounterTable,
  workOrder as workOrderTable,
} from '@/app/db/schema/work-order';
import { workOrderPriority as workOrderPriorityTable } from '@/app/db/schema/work-order-priority';
import { workOrderStatus as workOrderStatusTable } from '@/app/db/schema/work-order-status';
import { workOrderType as workOrderTypeTable } from '@/app/db/schema/work-order-type';

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
    await tx.delete(workOrderTable).where(eq(workOrderTable.tenantId, tenantId));
    await tx
      .delete(workOrderCodeCounterTable)
      .where(eq(workOrderCodeCounterTable.tenantId, tenantId));
    await tx.delete(assetTable).where(eq(assetTable.tenantId, tenantId));
    await tx
      .delete(appointmentCancelledReasonTable)
      .where(eq(appointmentCancelledReasonTable.tenantId, tenantId));
    await tx.delete(appointmentReasonTable).where(eq(appointmentReasonTable.tenantId, tenantId));
    await tx.delete(appointmentStatusTable).where(eq(appointmentStatusTable.tenantId, tenantId));
    await tx.delete(appointmentTypeTable).where(eq(appointmentTypeTable.tenantId, tenantId));
    await tx.delete(appointmentModeTable).where(eq(appointmentModeTable.tenantId, tenantId));
    await tx.delete(assetConditionTable).where(eq(assetConditionTable.tenantId, tenantId));
    await tx.delete(assetStatusTable).where(eq(assetStatusTable.tenantId, tenantId));
    await tx.delete(assetCategoryTable).where(eq(assetCategoryTable.tenantId, tenantId));
    await tx.delete(workOrderStatusTable).where(eq(workOrderStatusTable.tenantId, tenantId));
    await tx.delete(workOrderPriorityTable).where(eq(workOrderPriorityTable.tenantId, tenantId));
    await tx.delete(workOrderTypeTable).where(eq(workOrderTypeTable.tenantId, tenantId));
    await tx.delete(organization).where(eq(organization.id, tenantId));
  });
}

async function deleteAuthUser(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
}

type TenantScopedMasterTable = PgTable & { tenantId: PgColumn };

async function tableHasTenantRows(table: TenantScopedMasterTable, tenantId: string) {
  const [existingRow] = await db
    .select({ id: sql<number>`1` })
    .from(table)
    .where(eq(table.tenantId, tenantId))
    .limit(1);

  return Boolean(existingRow);
}

// A master family counts as seeded only when every one of its tables holds at
// least one row for the tenant (soft-deleted rows included) — seeding is not
// atomic, so a single populated table can be leftover from a failed attempt.
async function hasSeededMasterTables(tables: TenantScopedMasterTable[], tenantId: string) {
  const results = await Promise.all(tables.map((table) => tableHasTenantRows(table, tenantId)));

  return results.every(Boolean);
}

async function hasSeededAppointmentMasters(tenantId: string) {
  return hasSeededMasterTables(
    [
      appointmentModeTable,
      appointmentTypeTable,
      appointmentReasonTable,
      appointmentStatusTable,
      appointmentCancelledReasonTable,
    ],
    tenantId
  );
}

async function hasSeededSpecialties(tenantId: string) {
  return tableHasTenantRows(specialtyTable, tenantId);
}

async function hasSeededAssetMasters(tenantId: string) {
  return hasSeededMasterTables(
    [assetStatusTable, assetCategoryTable, assetConditionTable],
    tenantId
  );
}

async function hasSeededWorkOrderMasters(tenantId: string) {
  return hasSeededMasterTables(
    [workOrderTypeTable, workOrderStatusTable, workOrderPriorityTable],
    tenantId
  );
}

async function hasSeededClinicalMasters(tenantId: string) {
  return hasSeededMasterTables(
    [diagnosisCodeTable, allergenTable, clinicalNoteTypeTable],
    tenantId
  );
}

export const tenantProvisioningRepository = {
  deleteAuthUser,
  findUserByEmail,
  deleteTenantArtifacts,
  hasSeededSpecialties,
  hasSeededAssetMasters,
  hasSeededWorkOrderMasters,
  hasSeededClinicalMasters,
  hasSeededAppointmentMasters,
};
