'use client';

import Link from 'next/link';
import { PiClipboardTextDuotone } from 'react-icons/pi';

import type { AuditEventListItem } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import { EmptyState } from '@/components/app/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  actionLabel,
  describeDevice,
  formatAuditTime,
  formatChangeValue,
  impersonatedBy,
  patientName,
  recordTypeLabel,
} from '../_utils/audit-log-filters';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-3 sm:gap-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm break-words whitespace-normal sm:col-span-2">{children}</dd>
    </div>
  );
}

function ChangesTable({ changes }: { changes: NonNullable<AuditEventListItem['changes']> }) {
  return (
    <div className="bg-card overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-3">Field</TableHead>
            <TableHead>Old value</TableHead>
            <TableHead className="pr-3">New value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((change) => (
            <TableRow key={change.field} className="align-top">
              <TableCell className="pl-3 font-medium whitespace-normal">{change.label}</TableCell>
              <TableCell className="text-muted-foreground max-w-72 whitespace-pre-wrap">
                {formatChangeValue(change.from)}
              </TableCell>
              <TableCell className="max-w-72 pr-3 whitespace-pre-wrap">
                {formatChangeValue(change.to)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function metadataEntries(metadata: Record<string, unknown>) {
  return Object.entries(metadata).map(([key, value]) => [
    key,
    Array.isArray(value)
      ? value
          .map((item) =>
            typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)
          )
          .join(', ') || '—'
      : typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : String(value),
  ]);
}

/**
 * Everything recorded for one Audit Event, shown in place under its row: who, what and where on
 * the left, and every changed field plus the event's context on the right. Below `lg` the two
 * halves stack.
 */
export function AuditEventDetails({
  event,
  timeZone,
}: {
  event: AuditEventListItem;
  timeZone: string | undefined;
}) {
  const operator = impersonatedBy(event);

  return (
    <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <dl className="divide-y">
        <DetailRow label="Date and time">
          {formatAuditTime(event.occurredOn, timeZone)}
          <span className="text-muted-foreground block font-mono text-xs">
            {new Date(event.occurredOn).toISOString()} (UTC)
          </span>
        </DetailRow>
        <DetailRow label="User">
          {event.actorName}
          {event.actorEmail ? (
            <span className="text-muted-foreground block text-xs">{event.actorEmail}</span>
          ) : null}
        </DetailRow>
        <DetailRow label="User roles">{event.actorRoles ?? '—'}</DetailRow>
        {operator ? (
          <DetailRow label="Support access">
            <span className="text-destructive">
              Acted through an impersonated Session by {operator}
            </span>
          </DetailRow>
        ) : null}
        <DetailRow label="Action">
          {actionLabel(event.action)}
          <span className="text-muted-foreground block font-mono text-xs">{event.action}</span>
        </DetailRow>
        <DetailRow label="Outcome">
          <span className="capitalize">{event.outcome}</span>
        </DetailRow>
        <DetailRow label="Record">
          {recordTypeLabel(event.entityType)}
          {event.entityLabel ? ` ${event.entityLabel}` : ''}
          {event.entityId ? (
            <span className="text-muted-foreground block font-mono text-xs">
              {event.entityType} #{event.entityId}
            </span>
          ) : null}
        </DetailRow>
        {event.patient ? (
          <DetailRow label="Patient">
            <Link
              href={`/patients/${event.patient.id}`}
              className="hover:text-primary hover:underline"
            >
              {patientName(event)}
            </Link>
            <span className="text-muted-foreground block font-mono text-xs">
              {event.patient.mrn}
            </span>
          </DetailRow>
        ) : null}
        {event.visitId ? (
          <DetailRow label="Visit">
            <Link href={`/visits/${event.visitId}`} className="hover:text-primary hover:underline">
              Visit #{event.visitId}
            </Link>
          </DetailRow>
        ) : null}
        {event.reason ? <DetailRow label="Reason">{event.reason}</DetailRow> : null}
        <DetailRow label="IP address">
          <span className="font-mono text-xs">{event.ipAddress ?? '—'}</span>
        </DetailRow>
        <DetailRow label="Device">
          {describeDevice(event.userAgent) ?? '—'}
          {event.userAgent ? (
            <span className="text-muted-foreground block text-xs">{event.userAgent}</span>
          ) : null}
        </DetailRow>
      </dl>

      <div className="min-w-0 space-y-6">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">
            Changes{event.changes?.length ? ` (${event.changes.length})` : ''}
          </h3>
          {event.changes?.length ? (
            <ChangesTable changes={event.changes} />
          ) : (
            <EmptyState
              size="sm"
              tone="neutral"
              icon={PiClipboardTextDuotone}
              title="No field changes"
              description="This event recorded an action, not a change to individual fields."
            />
          )}
        </section>

        {event.metadata && Object.keys(event.metadata).length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Context</h3>
            <dl className="bg-card divide-y rounded-md border px-3">
              {metadataEntries(event.metadata).map(([key, value]) => (
                <DetailRow key={key} label={key}>
                  <span className="font-mono text-xs">{value}</span>
                </DetailRow>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}
