import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  max,
  min,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import { db } from '@/app/db';
import { auditEvent as auditEventTable } from '@/app/db/schema/audit-event';
import { member, session as sessionTable, user as userTable } from '@/app/db/schema/auth';
import { role as roleTable } from '@/app/db/schema/role';
import { staffProfile as staffProfileTable } from '@/app/db/schema/staff-profile';
import { userRole as userRoleTable } from '@/app/db/schema/user-role';
import type {
  LiveSession,
  SessionActivity,
  SessionEndEvent,
  SessionSignIn,
} from '../queries/build-user-sessions';
import type {
  UserAuditDevice,
  UserAuditFailedSignIn,
  UserAuditIpAddress,
  UserAuditListItem,
  UserAuditListParams,
  UserAuditRange,
} from '../schemas/user-audit-schema';

const SIGN_IN = 'auth.sign-in';
const SIGN_IN_FAILED = 'auth.sign-in-failed';
const SESSION_END_ACTIONS = ['auth.sign-out', 'auth.session-revoke', 'user.sessions-revoke'];

const MEMBERSHIP_ROLE_LABELS = sql`case
  when ${member.role} like '%owner%' then 'Tenant Owner'
  when ${member.role} like '%admin%' then 'Tenant Admin'
  else null end`;

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

// From/To are the Tenant's local days, turned into instants so the occurred_on
// index is used (as in the Audit Log repository).
function rangeConditions(column: SQL | typeof auditEventTable.occurredOn, range: UserAuditRange) {
  const conditions: SQL[] = [];

  if (range.fromDate) {
    conditions.push(
      sql`${column} >= (${range.fromDate}::date)::timestamp AT TIME ZONE ${range.timeZone}`
    );
  }

  if (range.toDate) {
    conditions.push(
      sql`${column} < ((${range.toDate}::date) + 1)::timestamp AT TIME ZONE ${range.timeZone}`
    );
  }

  return conditions;
}

function rangeSql(range: UserAuditRange) {
  const conditions = rangeConditions(sql.raw('e.occurred_on'), range);
  return conditions.length ? sql` and ${sql.join(conditions, sql` and `)}` : sql``;
}

// Correlated per-user figures. `e` is the audit_event alias inside each subquery.
function eventCount(range: UserAuditRange, filter: SQL) {
  return sql<number>`(select count(*)::int from audit_event e
    where e.tenant_id = ${range.tenantId} and e.actor_user_id = ${userTable.id}
    and ${filter}${rangeSql(range)})`;
}

function lastSignIn<T>(tenantId: string, column: string) {
  return sql<T>`(select ${sql.raw(`e.${column}`)} from audit_event e
    where e.tenant_id = ${tenantId} and e.actor_user_id = ${userTable.id}
    and e.action = ${SIGN_IN}
    order by e.occurred_on desc limit 1)`;
}

// Membership (Tenant Owner / Tenant Admin) first, then assigned Roles by name, each once.
function roleNames(tenantId: string) {
  return sql<string | null>`(select string_agg(names.name, ', ' order by names.ord, names.name)
    from (
      select labels.name, min(labels.ord) as ord from (
        select ${MEMBERSHIP_ROLE_LABELS} as name, 0 as ord
        union all
        select ${roleTable.name}, 1
          from ${userRoleTable} join ${roleTable} on ${roleTable.id} = ${userRoleTable.roleId}
          where ${userRoleTable.userId} = ${userTable.id}
          and ${userRoleTable.tenantId} = ${tenantId}
          and ${roleTable.tenantId} = ${tenantId} and ${roleTable.isDeleted} = false
      ) labels
      where labels.name is not null
      group by labels.name
    ) names)`;
}

function activeSessionCount(tenantId: string) {
  return sql<number>`(select count(*)::int from ${sessionTable}
    where ${sessionTable.userId} = ${userTable.id}
    and ${sessionTable.activeOrganizationId} = ${tenantId}
    and ${sessionTable.expiresAt} > now())`;
}

function memberColumns(range: UserAuditRange) {
  return {
    userId: userTable.id,
    name: userTable.name,
    email: userTable.email,
    roles: roleNames(range.tenantId),
    staffCode: staffProfileTable.staffCode,
    isActive: sql<boolean>`coalesce(${staffProfileTable.isActive}, true)`,
    lastSignInAt: lastSignIn<Date | null>(range.tenantId, 'occurred_on'),
    lastSignInIp: lastSignIn<string | null>(range.tenantId, 'ip_address'),
    lastSignInUserAgent: lastSignIn<string | null>(range.tenantId, 'user_agent'),
    lastActivityAt: sql<Date | null>`(select max(e.occurred_on) from audit_event e
      where e.tenant_id = ${range.tenantId} and e.actor_user_id = ${userTable.id})`,
    signInCount: eventCount(range, sql`e.action = ${SIGN_IN}`),
    failedSignInCount: eventCount(range, sql`e.action = ${SIGN_IN_FAILED}`),
    actionCount: eventCount(range, sql`e.category <> 'auth'`),
    activeSessionCount: activeSessionCount(range.tenantId),
  };
}

const staffJoin = (tenantId: string) =>
  and(eq(staffProfileTable.userId, userTable.id), eq(staffProfileTable.tenantId, tenantId));

// Raw subquery results arrive as strings; normalise them to the declared types.
function toListItem(row: Record<string, unknown>): UserAuditListItem {
  const toDate = (value: unknown) => (value ? new Date(value as string) : null);

  return {
    userId: row.userId as string,
    name: row.name as string,
    email: row.email as string,
    roles: (row.roles as string | null) ?? null,
    isActive: Boolean(row.isActive),
    staffCode: (row.staffCode as string | null) ?? null,
    lastSignInAt: toDate(row.lastSignInAt),
    lastSignInIp: (row.lastSignInIp as string | null) ?? null,
    lastSignInUserAgent: (row.lastSignInUserAgent as string | null) ?? null,
    lastActivityAt: toDate(row.lastActivityAt),
    signInCount: Number(row.signInCount ?? 0),
    failedSignInCount: Number(row.failedSignInCount ?? 0),
    actionCount: Number(row.actionCount ?? 0),
    activeSessionCount: Number(row.activeSessionCount ?? 0),
  };
}

async function getUserAuditList(
  params: UserAuditListParams
): Promise<{ data: UserAuditListItem[]; total: number }> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const conditions: SQL[] = [eq(member.organizationId, params.tenantId)];
  const trimmedQuery = params.query?.trim();

  if (trimmedQuery) {
    const pattern = `%${escapeLikePattern(trimmedQuery)}%`;
    const search = or(
      ilike(userTable.name, pattern),
      ilike(userTable.email, pattern),
      ilike(staffProfileTable.staffCode, pattern)
    );
    if (search) conditions.push(search);
  }

  const where = and(...conditions);
  const columns = memberColumns(params);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(columns)
      .from(member)
      .innerJoin(userTable, eq(userTable.id, member.userId))
      .leftJoin(staffProfileTable, staffJoin(params.tenantId))
      .where(where)
      .orderBy(sql`${columns.lastActivityAt} desc nulls last`, asc(userTable.name))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(member)
      .innerJoin(userTable, eq(userTable.id, member.userId))
      .leftJoin(staffProfileTable, staffJoin(params.tenantId))
      .where(where),
  ]);

  return { data: rows.map((row) => toListItem(row)), total };
}

/** The member's row (list figures included), or undefined when they are not in the Tenant. */
async function getUserAuditMember(range: UserAuditRange, userId: string) {
  const [row] = await db
    .select({
      ...memberColumns(range),
      memberSince: member.createdAt,
      accountCreatedAt: userTable.createdAt,
    })
    .from(member)
    .innerJoin(userTable, eq(userTable.id, member.userId))
    .leftJoin(staffProfileTable, staffJoin(range.tenantId))
    .where(and(eq(member.organizationId, range.tenantId), eq(member.userId, userId)))
    .limit(1);

  return row
    ? { ...toListItem(row), memberSince: row.memberSince, accountCreatedAt: row.accountCreatedAt }
    : undefined;
}

const ownEvents = (range: UserAuditRange, userId: string) => [
  eq(auditEventTable.tenantId, range.tenantId),
  eq(auditEventTable.actorUserId, userId),
];

async function getSignIns(
  range: UserAuditRange,
  userId: string,
  limit: number
): Promise<SessionSignIn[]> {
  const rows = await db
    .select({
      sessionId: auditEventTable.entityId,
      occurredOn: auditEventTable.occurredOn,
      ipAddress: auditEventTable.ipAddress,
      userAgent: auditEventTable.userAgent,
      metadata: auditEventTable.metadata,
    })
    .from(auditEventTable)
    .where(
      and(
        ...ownEvents(range, userId),
        eq(auditEventTable.action, SIGN_IN),
        isNotNull(auditEventTable.entityId),
        ...rangeConditions(auditEventTable.occurredOn, range)
      )
    )
    .orderBy(desc(auditEventTable.occurredOn))
    .limit(limit);

  return rows.map((row) => {
    const rememberMe = (row.metadata as { rememberMe?: unknown } | null)?.rememberMe;
    return {
      sessionId: row.sessionId as string,
      occurredOn: row.occurredOn,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      rememberMe: typeof rememberMe === 'boolean' ? rememberMe : null,
    };
  });
}

/** Every sign-out or revoke that can end this user's Sessions, from `since` onwards. */
async function getSessionEndEvents(
  tenantId: string,
  userId: string,
  since: Date
): Promise<SessionEndEvent[]> {
  const rows = await db
    .select({
      action: auditEventTable.action,
      occurredOn: auditEventTable.occurredOn,
      entityId: auditEventTable.entityId,
      metadata: auditEventTable.metadata,
      reason: auditEventTable.reason,
      actorName: auditEventTable.actorName,
      actorUserId: auditEventTable.actorUserId,
    })
    .from(auditEventTable)
    .where(
      and(
        eq(auditEventTable.tenantId, tenantId),
        inArray(auditEventTable.action, SESSION_END_ACTIONS),
        gte(auditEventTable.occurredOn, since),
        or(
          and(
            ne(auditEventTable.action, 'user.sessions-revoke'),
            eq(auditEventTable.actorUserId, userId)
          ),
          and(
            eq(auditEventTable.action, 'user.sessions-revoke'),
            eq(auditEventTable.entityId, userId)
          )
        )
      )
    )
    .orderBy(asc(auditEventTable.occurredOn));

  return rows.map((row) => {
    const sessionIds = (row.metadata as { sessionIds?: unknown } | null)?.sessionIds;
    return {
      action: row.action,
      occurredOn: row.occurredOn,
      entityId: row.entityId,
      reason: row.reason,
      actorName: row.actorName,
      actorUserId: row.actorUserId,
      sessionIds: Array.isArray(sessionIds) ? sessionIds.map(String) : [],
    };
  });
}

/** Actions (not sign-in events) taken in each Session, and when the last one was. */
async function getSessionActivity(
  tenantId: string,
  sessionIds: string[]
): Promise<SessionActivity[]> {
  if (!sessionIds.length) return [];

  const rows = await db
    .select({
      sessionId: auditEventTable.sessionId,
      actionCount: sql<number>`count(*) filter (where ${auditEventTable.category} <> 'auth')::int`,
      lastActivityAt: max(auditEventTable.occurredOn),
    })
    .from(auditEventTable)
    .where(
      and(eq(auditEventTable.tenantId, tenantId), inArray(auditEventTable.sessionId, sessionIds))
    )
    .groupBy(auditEventTable.sessionId);

  return rows.flatMap((row) =>
    row.sessionId && row.lastActivityAt
      ? [
          {
            sessionId: row.sessionId,
            actionCount: Number(row.actionCount),
            lastActivityAt: row.lastActivityAt,
          },
        ]
      : []
  );
}

async function getLiveSessions(tenantId: string, userId: string): Promise<LiveSession[]> {
  return db
    .select({
      id: sessionTable.id,
      createdAt: sessionTable.createdAt,
      expiresAt: sessionTable.expiresAt,
      ipAddress: sessionTable.ipAddress,
      userAgent: sessionTable.userAgent,
    })
    .from(sessionTable)
    .where(
      and(
        eq(sessionTable.userId, userId),
        eq(sessionTable.activeOrganizationId, tenantId),
        gt(sessionTable.expiresAt, sql`now() - interval '30 days'`)
      )
    );
}

async function getFailedSignIns(
  range: UserAuditRange,
  userId: string,
  limit: number
): Promise<UserAuditFailedSignIn[]> {
  return db
    .select({
      occurredOn: auditEventTable.occurredOn,
      ipAddress: auditEventTable.ipAddress,
      userAgent: auditEventTable.userAgent,
      reason: auditEventTable.reason,
    })
    .from(auditEventTable)
    .where(
      and(
        ...ownEvents(range, userId),
        eq(auditEventTable.action, SIGN_IN_FAILED),
        ...rangeConditions(auditEventTable.occurredOn, range)
      )
    )
    .orderBy(desc(auditEventTable.occurredOn))
    .limit(limit);
}

async function getIpAddresses(
  range: UserAuditRange,
  userId: string,
  limit: number
): Promise<UserAuditIpAddress[]> {
  const rows = await db
    .select({
      ipAddress: auditEventTable.ipAddress,
      eventCount: count(),
      firstSeenAt: min(auditEventTable.occurredOn),
      lastSeenAt: max(auditEventTable.occurredOn),
    })
    .from(auditEventTable)
    .where(
      and(
        ...ownEvents(range, userId),
        isNotNull(auditEventTable.ipAddress),
        ...rangeConditions(auditEventTable.occurredOn, range)
      )
    )
    .groupBy(auditEventTable.ipAddress)
    .orderBy(desc(max(auditEventTable.occurredOn)))
    .limit(limit);

  return rows.map((row) => ({
    ipAddress: row.ipAddress as string,
    eventCount: row.eventCount,
    firstSeenAt: row.firstSeenAt as Date,
    lastSeenAt: row.lastSeenAt as Date,
  }));
}

async function getDevices(
  range: UserAuditRange,
  userId: string,
  limit: number
): Promise<UserAuditDevice[]> {
  const rows = await db
    .select({
      userAgent: auditEventTable.userAgent,
      eventCount: count(),
      firstSeenAt: min(auditEventTable.occurredOn),
      lastSeenAt: max(auditEventTable.occurredOn),
    })
    .from(auditEventTable)
    .where(
      and(
        ...ownEvents(range, userId),
        isNotNull(auditEventTable.userAgent),
        ...rangeConditions(auditEventTable.occurredOn, range)
      )
    )
    .groupBy(auditEventTable.userAgent)
    .orderBy(desc(max(auditEventTable.occurredOn)))
    .limit(limit);

  return rows.map((row) => ({
    userAgent: row.userAgent as string,
    eventCount: row.eventCount,
    firstSeenAt: row.firstSeenAt as Date,
    lastSeenAt: row.lastSeenAt as Date,
  }));
}

/** How many events the user recorded per action in the range; the query groups them by Module. */
async function getActionCounts(range: UserAuditRange, userId: string) {
  return db
    .select({ action: auditEventTable.action, count: count() })
    .from(auditEventTable)
    .where(and(...ownEvents(range, userId), ...rangeConditions(auditEventTable.occurredOn, range)))
    .groupBy(auditEventTable.action);
}

async function countDistinctInRange(range: UserAuditRange, userId: string) {
  const [row] = await db
    .select({
      ipAddressCount: sql<number>`count(distinct ${auditEventTable.ipAddress})::int`,
      deviceCount: sql<number>`count(distinct ${auditEventTable.userAgent})::int`,
    })
    .from(auditEventTable)
    .where(and(...ownEvents(range, userId), ...rangeConditions(auditEventTable.occurredOn, range)));

  return {
    ipAddressCount: Number(row?.ipAddressCount ?? 0),
    deviceCount: Number(row?.deviceCount ?? 0),
  };
}

export const userAuditRepository = {
  getDevices,
  getSignIns,
  getIpAddresses,
  getLiveSessions,
  getActionCounts,
  getFailedSignIns,
  getUserAuditList,
  getUserAuditMember,
  getSessionActivity,
  getSessionEndEvents,
  countDistinctInRange,
};
