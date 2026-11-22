import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_LABELS,
  AUDIT_MODULES,
  AUDIT_OPERATIONS,
  isAuditAction,
  type AuditModule,
  type AuditOperation,
} from '@/app/api/lib/modules/audit-log/schemas/audit-action-catalogue';
import type {
  AuditChange,
  AuditEventListItem,
} from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import type { AuditEventsParams } from '@/app/queries/audit-log/useAuditEvents';
import { describeUserAgent } from '@/lib/user-agent';

// Audit Log page size; the loading skeleton shows the same number of rows.
export const AUDIT_LOG_PAGE_SIZE = 25;

// The table shows this many changed fields per event; the rest are in the detail sheet.
export const VISIBLE_CHANGES = 3;

/** Filters as they appear in the URL. */
export type AuditLogUrlParams = {
  q: string | null;
  to: string | null;
  from: string | null;
  visit: string | null;
  module: string | null;
  patient: string | null;
  operation: string | null;
  actor?: string | null;
  session?: string | null;
};

export type AuditLogFilters = {
  query: string;
  to: string | null;
  from: string | null;
  visitId: string | null;
  patientId: string | null;
  module: AuditModule | null;
  operation: AuditOperation | null;
  actorUserId: string | null;
  sessionId: string | null;
};

export const AUDIT_MODULE_OPTIONS = AUDIT_MODULES.map((value) => ({ value, label: value }));

export const AUDIT_OPERATION_OPTIONS = AUDIT_OPERATIONS.map((value) => ({ value, label: value }));

const operationBadgeClass: Record<AuditOperation, string> = {
  View: 'border-chart-5/20 bg-chart-5/10 text-chart-5',
  Create: 'border-chart-4/20 bg-chart-4/10 text-chart-4',
  Update: 'border-chart-2/20 bg-chart-2/10 text-chart-2',
  Amend: 'border-chart-2/20 bg-chart-2/10 text-chart-2',
  Delete: 'border-destructive/20 bg-destructive/10 text-destructive',
  Sign: 'border-chart-1/20 bg-chart-1/10 text-chart-1',
  'Status change': 'border-chart-3/20 bg-chart-3/10 text-chart-3',
  Assign: 'border-chart-4/20 bg-chart-4/10 text-chart-4',
  Revoke: 'border-destructive/20 bg-destructive/10 text-destructive',
  Export: 'border-chart-1/20 bg-chart-1/10 text-chart-1',
  'Sign in': 'border-chart-5/20 bg-chart-5/10 text-chart-5',
  'Sign out': 'border-chart-3/20 bg-chart-3/10 text-chart-3',
};

export function operationBadgeClassName(operation: string) {
  return operationBadgeClass[operation as AuditOperation] ?? '';
}

/** The catalogue label, or the raw code for an action this build does not know yet. */
export function actionLabel(action: string) {
  return isAuditAction(action) ? AUDIT_ACTIONS[action].label : action;
}

/** How the kind of record is named, e.g. `Clinical Note`. */
export function recordTypeLabel(entityType: string) {
  return AUDIT_ENTITY_LABELS[entityType as keyof typeof AUDIT_ENTITY_LABELS] ?? entityType;
}

function isIsoDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isOpaqueId(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[\w-]{1,255}$/.test(value);
}

function isPositiveId(value: string | null): value is string {
  return value !== null && /^[1-9]\d*$/.test(value);
}

/**
 * Turns whatever is in the URL into filters the API accepts. A malformed value
 * drops that filter, and an inverted range drops both dates, so a hand-edited
 * link still lists something sensible.
 */
export function resolveFilters(params: AuditLogUrlParams): AuditLogFilters {
  const from = isIsoDate(params.from) ? params.from : null;
  const to = isIsoDate(params.to) ? params.to : null;
  const inverted = from !== null && to !== null && from > to;

  return {
    to: inverted ? null : to,
    from: inverted ? null : from,
    query: params.q?.trim() ?? '',
    visitId: isPositiveId(params.visit) ? params.visit : null,
    patientId: isPositiveId(params.patient) ? params.patient : null,
    module: AUDIT_MODULES.find((value) => value === params.module) ?? null,
    operation: AUDIT_OPERATIONS.find((value) => value === params.operation) ?? null,
    actorUserId: isOpaqueId(params.actor) ? params.actor : null,
    sessionId: isOpaqueId(params.session) ? params.session : null,
  };
}

/** How many filters differ from a fresh page, for the Reset button badge. */
export function countActiveFilters(filters: AuditLogFilters) {
  return [
    filters.from !== null || filters.to !== null,
    filters.query !== '',
    filters.module !== null,
    filters.operation !== null,
    filters.visitId !== null,
    filters.patientId !== null,
    filters.actorUserId !== null,
    filters.sessionId !== null,
  ].filter(Boolean).length;
}

export function toAuditEventsParams(filters: AuditLogFilters): AuditEventsParams {
  return {
    toDate: filters.to ?? undefined,
    fromDate: filters.from ?? undefined,
    query: filters.query || undefined,
    module: filters.module ?? undefined,
    operation: filters.operation ?? undefined,
    visitId: filters.visitId ? Number(filters.visitId) : undefined,
    patientId: filters.patientId ? Number(filters.patientId) : undefined,
    actorUserId: filters.actorUserId ?? undefined,
    sessionId: filters.sessionId ?? undefined,
  };
}

function dateTimeFormat(options: Intl.DateTimeFormatOptions, timeZone: string | undefined) {
  return new Intl.DateTimeFormat('en-GB', { ...options, ...(timeZone ? { timeZone } : {}) });
}

/** `22 Nov 2026, 10:15:42` in the Tenant's time zone (falls back to the browser's). */
export function formatAuditTime(value: Date | string, timeZone: string | undefined) {
  return dateTimeFormat(
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
    timeZone
  ).format(new Date(value));
}

/** The date and the time apart, for the table's two-line Date column. */
export function splitAuditTime(value: Date | string, timeZone: string | undefined) {
  const date = new Date(value);

  return {
    date: dateTimeFormat({ day: 'numeric', month: 'short', year: 'numeric' }, timeZone).format(
      date
    ),
    time: dateTimeFormat(
      { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' },
      timeZone
    ).format(date),
  };
}

export function formatChangeValue(value: AuditChange['from']) {
  if (value === null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  return String(value);
}

export function patientName(event: Pick<AuditEventListItem, 'patient'>) {
  return event.patient ? `${event.patient.firstName} ${event.patient.lastName}`.trim() : null;
}

/** The support operator behind an impersonated Session, when there was one. */
export function impersonatedBy(event: Pick<AuditEventListItem, 'metadata'>) {
  const value = event.metadata?.impersonatedBy;
  return typeof value === 'string' ? value : null;
}

/**
 * The event's reason or non-field context in one line, for the Details column.
 * Field changes have their own columns, so they are not repeated here.
 */
export function eventDetails(event: AuditEventListItem) {
  if (event.reason) return event.reason;

  const metadata = event.metadata ?? {};
  const added = Array.isArray(metadata.added) ? metadata.added : [];
  const removed = Array.isArray(metadata.removed) ? metadata.removed : [];

  if (added.length || removed.length) {
    return [
      added.length ? `Added ${added.join(', ')}` : null,
      removed.length ? `Removed ${removed.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('; ');
  }

  if (typeof metadata.rowCount === 'number') return `${metadata.rowCount} events exported`;

  const entries = Object.entries(metadata).filter(
    ([key, value]) => key !== 'impersonatedBy' && (typeof value !== 'object' || value === null)
  );

  return entries.length ? entries.map(([key, value]) => `${key}: ${value}`).join(' · ') : null;
}

/** A short device description from a user agent, e.g. `Chrome 156 on macOS`. */
export function describeDevice(userAgent: string | null) {
  return describeUserAgent(userAgent);
}
