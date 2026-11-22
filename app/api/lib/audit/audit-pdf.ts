// Writes Audit Events as a PDF report for the All Audit Events export: one row
// per event, oldest last, with every changed field stacked in its Changes cell.
// The CSV carries the full detail (one row per field, the raw user agent); the
// PDF is the version a person prints, signs off or attaches to an inquiry.

import { createPdfReport, type PdfReportColumn } from '@/app/api/lib/export/pdf-report';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_LABELS,
} from '@/app/api/lib/modules/audit-log/schemas/audit-action-catalogue';
import type {
  AuditChange,
  AuditEventFilters,
  AuditEventListItem,
} from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import { describeUserAgent } from '@/lib/user-agent';
import {
  auditLocalParts,
  auditPeriodLabel,
  auditReportDetails,
  auditReportFooter,
  auditTruncate,
  describeAuditMetadata,
  type AuditReportContext,
} from './audit-export-format';

const COLUMNS: PdfReportColumn[] = [
  { header: 'Date & time', width: 58 },
  { header: 'User', width: 92 },
  { header: 'Module', width: 54 },
  { header: 'Operation', width: 48 },
  { header: 'Action', width: 84 },
  { header: 'Record', width: 84 },
  { header: 'Patient', width: 76 },
  { header: 'Changes' },
  { header: 'Reason & details', width: 86 },
  { header: 'Source', width: 66 },
];

// A cell lists at most this many changed fields; the CSV has the rest.
const CHANGES_PER_CELL = 8;
const CHANGE_VALUE_LENGTH = 140;
const DETAILS_LENGTH = 300;

function patientName(event: AuditEventListItem) {
  return event.patient ? `${event.patient.firstName} ${event.patient.lastName}`.trim() : '';
}

function changeValueText(value: AuditChange['from']) {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function changesCell(event: AuditEventListItem) {
  const changes = event.changes ?? [];
  const shown = changes.slice(0, CHANGES_PER_CELL).map((change) => {
    const from = auditTruncate(changeValueText(change.from), CHANGE_VALUE_LENGTH);
    const to = auditTruncate(changeValueText(change.to), CHANGE_VALUE_LENGTH);
    return `${change.label}: ${from} -> ${to}`;
  });
  const hidden = changes.length - shown.length;

  return [...shown, ...(hidden > 0 ? [`+${hidden} more fields (see the CSV export)`] : [])].join(
    '\n'
  );
}

function rowFor(event: AuditEventListItem, timeZone: string): string[] {
  const local = auditLocalParts(event.occurredOn, timeZone);
  const action = AUDIT_ACTIONS[event.action]?.label ?? event.action;
  const recordType = AUDIT_ENTITY_LABELS[event.entityType] ?? event.entityType;
  const impersonatedBy = event.metadata?.impersonatedBy;
  const details = [
    event.reason ? `Reason: ${event.reason}` : '',
    describeAuditMetadata(event.metadata),
  ]
    .filter(Boolean)
    .join('\n');

  return [
    `${local.date}\n${local.time}\n#${event.id}`,
    [
      event.actorName,
      event.actorRoles,
      typeof impersonatedBy === 'string' ? `Support: ${impersonatedBy}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    event.module,
    event.operation,
    event.outcome === 'success' ? action : `${action}\nOutcome: ${event.outcome}`,
    [event.entityId ? `${recordType} ${event.entityId}` : recordType, event.entityLabel]
      .filter(Boolean)
      .join('\n'),
    event.patient ? `${event.patient.mrn}\n${patientName(event)}` : '',
    changesCell(event),
    auditTruncate(details, DETAILS_LENGTH),
    [event.ipAddress, describeUserAgent(event.userAgent)].filter(Boolean).join('\n'),
  ];
}

/**
 * The applied filters in words. Ids are named from the exported events where one
 * of them carries the name (the user, the Patient); otherwise the id is shown.
 */
export function describeAuditFilters(filters: AuditEventFilters, events: AuditEventListItem[]) {
  const actor = filters.actorUserId
    ? events.find((event) => event.actorUserId === filters.actorUserId)
    : undefined;
  const patient = filters.patientId
    ? events.find((event) => event.patient?.id === filters.patientId)?.patient
    : undefined;
  const parts = [
    filters.module && `Module ${filters.module}`,
    filters.operation && `Operation ${filters.operation}`,
    filters.category && `Category ${filters.category}`,
    filters.action && `Action ${AUDIT_ACTIONS[filters.action]?.label ?? filters.action}`,
    filters.actorUserId && `User ${actor?.actorName ?? filters.actorUserId}`,
    filters.patientId &&
      `Patient ${patient ? `${patient.mrn} ${patient.firstName} ${patient.lastName}`.trim() : `#${filters.patientId}`}`,
    filters.visitId && `Visit #${filters.visitId}`,
    filters.sessionId && `Session ${filters.sessionId}`,
    filters.entityType && `Record type ${AUDIT_ENTITY_LABELS[filters.entityType]}`,
    filters.entityId && `Record ID ${filters.entityId}`,
    filters.query && `Search "${filters.query}"`,
  ].filter(Boolean);

  return parts.length ? parts.join(' · ') : 'None';
}

export function toAuditPdf(
  events: AuditEventListItem[],
  filters: AuditEventFilters,
  context: AuditReportContext
): Promise<Uint8Array> {
  return createPdfReport({
    title: 'All Audit Events',
    subject: `Audit Events for ${context.tenantName}`,
    brand: context.brand,
    details: auditReportDetails(context, {
      period: auditPeriodLabel(filters.fromDate, filters.toDate),
      count: { label: 'Audit Events', value: events.length.toLocaleString('en-US') },
      filters: describeAuditFilters(filters, events),
    }),
    sections: [
      {
        columns: COLUMNS,
        rows: events.map((event) => rowFor(event, context.timeZone)),
        emptyText: 'No Audit Events match these filters.',
      },
    ],
    footerNote: auditReportFooter(context),
  });
}
