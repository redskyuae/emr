'use client';

import Link from 'next/link';
import { PiClipboardTextDuotone } from 'react-icons/pi';

import type { AuditEventListItem } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import { EmptyState } from '@/components/app/empty-state';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  operationBadgeClassName,
  patientName,
  recordTypeLabel,
} from '../../_utils/audit-log-filters';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-3 sm:gap-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm break-words sm:col-span-2">{children}</dd>
    </div>
  );
}

function ChangesTable({ changes }: { changes: NonNullable<AuditEventListItem['changes']> }) {
  return (
    <div className="overflow-hidden rounded-md border">
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
              <TableCell className="pl-3 font-medium">{change.label}</TableCell>
              <TableCell className="text-muted-foreground max-w-56 whitespace-pre-wrap">
                {formatChangeValue(change.from)}
              </TableCell>
              <TableCell className="max-w-56 pr-3 whitespace-pre-wrap">
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

export function AuditEventSheet({
  event,
  timeZone,
  onClose,
}: {
  event: AuditEventListItem | null;
  timeZone: string | undefined;
  onClose: () => void;
}) {
  const operator = event ? impersonatedBy(event) : null;

  return (
    <Sheet open={event !== null} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="border-b p-4 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle>{event ? actionLabel(event.action) : 'Audit Event'}</SheetTitle>
            {event ? (
              <Badge variant="outline" className={operationBadgeClassName(event.operation)}>
                {event.operation}
              </Badge>
            ) : null}
          </div>
          <SheetDescription>
            {event
              ? `${event.actorName} · ${formatAuditTime(event.occurredOn, timeZone)}`
              : 'Audit Event details'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {event ? (
            <div className="space-y-6 p-4">
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
                <DetailRow label="Module">{event.module}</DetailRow>
                <DetailRow label="Operation">{event.operation}</DetailRow>
                <DetailRow label="Action">
                  {actionLabel(event.action)}
                  <span className="text-muted-foreground block font-mono text-xs">
                    {event.action}
                  </span>
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
                    <Link
                      href={`/visits/${event.visitId}`}
                      className="hover:text-primary hover:underline"
                    >
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
                  <dl className="divide-y rounded-md border px-3">
                    {metadataEntries(event.metadata).map(([key, value]) => (
                      <DetailRow key={key} label={key}>
                        <span className="font-mono text-xs">{value}</span>
                      </DetailRow>
                    ))}
                  </dl>
                </section>
              ) : null}
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
