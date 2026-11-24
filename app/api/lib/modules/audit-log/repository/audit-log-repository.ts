import { and, count, desc, eq, gte, ilike, inArray, lt, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@/app/db';
import { auditEvent as auditEventTable } from '@/app/db/schema/audit-event';
import { patient as patientTable } from '@/app/db/schema/patient';
import {
  AUDIT_ACTIONS,
  auditActionsMatching,
  type AuditAction,
  type AuditCategory,
  type AuditEntityType,
} from '../schemas/audit-action-catalogue';
import type {
  AuditChange,
  AuditEvent,
  AuditEventFilters,
  AuditEventListItem,
  ValidatedAuditEvent,
} from '../schemas/audit-log-schema';

type AuditEventRow = typeof auditEventTable.$inferSelect;

type AuditEventQueryParams = AuditEventFilters & { tenantId: string; timeZone: string };

const listColumns = {
  event: auditEventTable,
  patientId: patientTable.id,
  patientMrn: patientTable.mrn,
  patientLastName: patientTable.lastName,
  patientFirstName: patientTable.firstName,
};

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function toAuditEvent(row: AuditEventRow): AuditEvent {
  const action = row.action as AuditAction;
  // Module and Operation are derived from the catalogue, not stored, so
  // regrouping an action re-labels its whole history consistently.
  const definition = AUDIT_ACTIONS[action];

  return {
    ...row,
    action,
    module: definition?.module ?? 'Audit Log',
    operation: definition?.operation ?? 'View',
    category: row.category as AuditCategory,
    entityType: row.entityType as AuditEntityType,
    changes: (row.changes as AuditChange[] | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

// From/To are the Tenant's local calendar days. Converting each bound to an
// instant (rather than casting occurred_on to a date) keeps the range on the
// (tenant_id, occurred_on) index.
function filterConditions(params: AuditEventQueryParams): SQL[] {
  const conditions: SQL[] = [eq(auditEventTable.tenantId, params.tenantId)];

  if (params.fromDate) {
    conditions.push(
      gte(
        auditEventTable.occurredOn,
        sql`(${params.fromDate}::date)::timestamp AT TIME ZONE ${params.timeZone}`
      )
    );
  }

  if (params.toDate) {
    conditions.push(
      lt(
        auditEventTable.occurredOn,
        sql`((${params.toDate}::date) + 1)::timestamp AT TIME ZONE ${params.timeZone}`
      )
    );
  }

  if (params.action) conditions.push(eq(auditEventTable.action, params.action));

  if (params.module || params.operation) {
    const actions = auditActionsMatching({ module: params.module, operation: params.operation });
    conditions.push(actions.length ? inArray(auditEventTable.action, actions) : sql`false`);
  }
  if (params.visitId) conditions.push(eq(auditEventTable.visitId, params.visitId));
  if (params.category) conditions.push(eq(auditEventTable.category, params.category));
  if (params.patientId) conditions.push(eq(auditEventTable.patientId, params.patientId));
  if (params.entityId) conditions.push(eq(auditEventTable.entityId, params.entityId));
  if (params.entityType) conditions.push(eq(auditEventTable.entityType, params.entityType));
  if (params.actorUserId) conditions.push(eq(auditEventTable.actorUserId, params.actorUserId));
  if (params.sessionId) conditions.push(eq(auditEventTable.sessionId, params.sessionId));

  const trimmedQuery = params.query?.trim();

  if (trimmedQuery) {
    const pattern = `%${escapeLikePattern(trimmedQuery)}%`;
    const search = or(
      ilike(auditEventTable.action, pattern),
      ilike(auditEventTable.actorName, pattern),
      ilike(auditEventTable.actorEmail, pattern),
      ilike(auditEventTable.actorRoles, pattern),
      ilike(auditEventTable.entityLabel, pattern),
      ilike(patientTable.mrn, pattern),
      ilike(patientTable.firstName, pattern),
      ilike(patientTable.lastName, pattern)
    );

    if (search) conditions.push(search);
  }

  return conditions;
}

// The Patient join is tenant-qualified, so an Audit Event can never surface
// another Tenant's Patient even if ids were ever to collide.
const patientJoin = and(
  eq(patientTable.id, auditEventTable.patientId),
  eq(patientTable.tenantId, auditEventTable.tenantId)
);

type ListRow = {
  event: AuditEventRow;
  patientId: number | null;
  patientMrn: string | null;
  patientLastName: string | null;
  patientFirstName: string | null;
};

function toListItem(row: ListRow): AuditEventListItem {
  return {
    ...toAuditEvent(row.event),
    patient:
      row.patientId === null
        ? null
        : {
            id: row.patientId,
            mrn: row.patientMrn ?? '',
            lastName: row.patientLastName ?? '',
            firstName: row.patientFirstName ?? '',
          },
  };
}

async function recordAuditEvent(data: ValidatedAuditEvent): Promise<AuditEvent> {
  const [row] = await db
    .insert(auditEventTable)
    .values({
      tenantId: data.tenantId,
      action: data.action,
      reason: data.reason ?? null,
      visitId: data.visitId ?? null,
      changes: data.changes?.length ? data.changes : null,
      category: data.category,
      entityId: data.entityId ?? null,
      metadata: data.metadata ?? null,
      actorName: data.actorName,
      patientId: data.patientId ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      entityType: data.entityType,
      actorEmail: data.actorEmail ?? null,
      actorRoles: data.actorRoles ?? null,
      sessionId: data.sessionId ?? null,
      outcome: data.outcome ?? 'success',
      entityLabel: data.entityLabel ?? null,
      actorUserId: data.actorUserId,
    })
    .returning();

  return toAuditEvent(row);
}

async function getAuditEvents(
  params: AuditEventQueryParams & { page?: number; limit?: number }
): Promise<{ data: AuditEventListItem[]; total: number }> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const where = and(...filterConditions(params));

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(listColumns)
      .from(auditEventTable)
      .leftJoin(patientTable, patientJoin)
      .where(where)
      .orderBy(desc(auditEventTable.occurredOn), desc(auditEventTable.id))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(auditEventTable)
      .leftJoin(patientTable, patientJoin)
      .where(where),
  ]);

  return { data: rows.map(toListItem), total };
}

async function countAuditEvents(params: AuditEventQueryParams): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(auditEventTable)
    .leftJoin(patientTable, patientJoin)
    .where(and(...filterConditions(params)));

  return total;
}

async function getAuditEventsForExport(
  params: AuditEventQueryParams,
  maxRows: number
): Promise<AuditEventListItem[]> {
  const rows = await db
    .select(listColumns)
    .from(auditEventTable)
    .leftJoin(patientTable, patientJoin)
    .where(and(...filterConditions(params)))
    .orderBy(desc(auditEventTable.occurredOn), desc(auditEventTable.id))
    .limit(maxRows);

  return rows.map(toListItem);
}

export const auditLogRepository = {
  getAuditEvents,
  recordAuditEvent,
  countAuditEvents,
  getAuditEventsForExport,
};
