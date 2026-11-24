import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * One Audit Event: who did what to which record, and to which Patient (ADR 0053).
 *
 * Append-only. There is no `isDeleted`, no `modifiedOn`, and a database trigger
 * (migration 0081) rejects every UPDATE and DELETE, so an Audit Event can never be
 * rewritten or removed by the application. This is the named exception to the
 * soft-delete default of ADR 0012.
 *
 * `patientId` and `visitId` are plain integers rather than foreign keys: the audit
 * trail must outlive the records it describes and must never block their removal.
 */
export const auditEvent = pgTable(
  'audit_event',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    occurredOn: timestamp('occurred_on', { withTimezone: true }).notNull().defaultNow(),
    // Null only for a system actor. Name and email are snapshots at event time, so
    // renaming a user never rewrites history.
    actorUserId: varchar('actor_user_id', { length: 255 }),
    actorName: varchar('actor_name', { length: 255 }).notNull(),
    actorEmail: varchar('actor_email', { length: 320 }),
    // The actor's Roles at event time, such as "Doctor, Tenant Admin".
    actorRoles: varchar('actor_roles', { length: 500 }),
    // The BetterAuth Session the actor acted in (its id, never its token), so a
    // Session's sign-in, actions and sign-out can be read together.
    sessionId: varchar('session_id', { length: 255 }),
    action: varchar({ length: 100 }).notNull(),
    category: varchar({ length: 20 }).notNull(),
    outcome: varchar({ length: 20 }).notNull().default('success'),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }),
    // A human-readable snapshot of the target, such as a Visit Number.
    entityLabel: varchar('entity_label', { length: 255 }),
    patientId: integer('patient_id'),
    visitId: integer('visit_id'),
    reason: text(),
    // Field-level before/after for updates and amendments: [{ field, from, to }].
    changes: jsonb(),
    // Extra context that is not a field change, such as the filters of an export.
    metadata: jsonb(),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
  },
  (table) => [
    index('audit_event_tenant_occurred_idx').on(table.tenantId, table.occurredOn.desc()),
    index('audit_event_tenant_patient_idx')
      .on(table.tenantId, table.patientId, table.occurredOn.desc())
      .where(sql`${table.patientId} is not null`),
    index('audit_event_tenant_visit_idx')
      .on(table.tenantId, table.visitId, table.occurredOn.desc())
      .where(sql`${table.visitId} is not null`),
    index('audit_event_tenant_actor_idx').on(
      table.tenantId,
      table.actorUserId,
      table.occurredOn.desc()
    ),
    index('audit_event_tenant_session_idx')
      .on(table.tenantId, table.sessionId)
      .where(sql`${table.sessionId} is not null`),
    index('audit_event_tenant_entity_idx').on(table.tenantId, table.entityType, table.entityId),
  ]
);
