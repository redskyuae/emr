// Writes Audit Events as CSV for the Audit Log export. An event that changed
// several fields becomes one row per field, each with its Old value and New value,
// so a spreadsheet can filter on a single field; the Event ID ties those rows back
// together. Cells are quoted, and any value a spreadsheet would evaluate as a
// formula is neutralised, because Patient names and free text reach this file and
// a crafted one must not run in Excel.

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_LABELS,
} from '@/app/api/lib/modules/audit-log/schemas/audit-action-catalogue';
import type {
  AuditChange,
  AuditEventListItem,
} from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import { parseUserAgent } from '@/lib/user-agent';
import { auditLocalParts, describeAuditMetadata } from './audit-export-format';

const HEADER = [
  'Event ID',
  'Session ID',
  'Date',
  'Time',
  'Time zone',
  'Date and time (UTC)',
  'User',
  'User email',
  'User roles',
  'Module',
  'Operation',
  'Action',
  'Action code',
  'Category',
  'Outcome',
  'Record type',
  'Record ID',
  'Record',
  'Patient MRN',
  'Patient name',
  'Visit ID',
  'Field',
  'Old value',
  'New value',
  'Reason',
  'Details',
  'IP address',
  'Browser',
  'Operating system',
  'Device type',
  'Device',
  'Acting support user',
] as const;

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

type Cell = string | number | boolean | null | undefined;

export function escapeCsvCell(value: Cell): string {
  if (value === null || value === undefined) return '';

  const text = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  const safe = FORMULA_PREFIX.test(text) ? `'${text}` : text;

  return /[",\r\n]/.test(safe) || safe !== text ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function rowsFor(event: AuditEventListItem, timeZone: string): Cell[][] {
  const local = auditLocalParts(event.occurredOn, timeZone);
  const definition = AUDIT_ACTIONS[event.action];
  const impersonatedBy = event.metadata?.impersonatedBy;
  const changes: (AuditChange | null)[] = event.changes?.length ? event.changes : [null];
  const device = parseUserAgent(event.userAgent);
  const browser = [device.browser, device.browserVersion].filter(Boolean).join(' ') || null;

  return changes.map((change) => [
    event.id,
    event.sessionId,
    local.date,
    local.time,
    timeZone,
    event.occurredOn.toISOString(),
    event.actorName,
    event.actorEmail,
    event.actorRoles,
    event.module,
    event.operation,
    definition?.label ?? event.action,
    event.action,
    event.category,
    event.outcome,
    AUDIT_ENTITY_LABELS[event.entityType] ?? event.entityType,
    event.entityId,
    event.entityLabel,
    event.patient?.mrn,
    event.patient ? `${event.patient.firstName} ${event.patient.lastName}`.trim() : null,
    event.visitId,
    change?.label,
    change?.from,
    change?.to,
    event.reason,
    describeAuditMetadata(event.metadata),
    event.ipAddress,
    browser,
    device.os,
    device.deviceType,
    event.userAgent,
    typeof impersonatedBy === 'string' ? impersonatedBy : null,
  ]);
}

export function toAuditCsv(events: AuditEventListItem[], timeZone: string): string {
  const rows = events.flatMap((event) => rowsFor(event, timeZone));

  // A byte-order mark lets Excel open the UTF-8 file with Arabic and accented names intact.
  return `﻿${[HEADER, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}\r\n`;
}
