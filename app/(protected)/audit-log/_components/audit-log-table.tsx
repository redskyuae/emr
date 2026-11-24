'use client';

import Link from 'next/link';
import { CiRead } from 'react-icons/ci';

import type { AuditEventListItem } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCount } from '@/lib/format-count';
import { cn } from '@/lib/utils';
import {
  AUDIT_LOG_PAGE_SIZE,
  VISIBLE_CHANGES,
  actionLabel,
  describeDevice,
  eventDetails,
  formatAuditTime,
  formatChangeValue,
  impersonatedBy,
  operationBadgeClassName,
  patientName,
  recordTypeLabel,
  splitAuditTime,
} from '../_utils/audit-log-filters';

const COLUMNS = [
  'Date & time',
  'User',
  'Module',
  'Operation',
  'Action',
  'Record',
  'Patient',
  'Visit',
  'Field',
  'Old value',
  'New value',
  'Details',
  'IP address',
  'Device',
] as const;

// Wide enough that every column keeps its content on readable lines; the card scrolls sideways.
const TABLE_MIN_WIDTH = 'min-w-[2050px]';

type RowProps = {
  timeZone: string | undefined;
  onOpen: (event: AuditEventListItem) => void;
};

function OperationBadge({ operation }: { operation: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('whitespace-nowrap', operationBadgeClassName(operation))}
    >
      {operation}
    </Badge>
  );
}

function OpenButton({ event, onOpen }: { event: AuditEventListItem; onOpen: RowProps['onOpen'] }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Details of ${actionLabel(event.action)} by ${event.actorName}`}
      onClick={() => onOpen(event)}
    >
      <CiRead className="size-4" />
    </Button>
  );
}

/**
 * One line per changed field, in the same order and height in the Field, Old value and New value
 * columns so they read across. Extra changes are counted on a last line and shown in full in the
 * detail sheet.
 */
function ChangeLines({
  event,
  render,
  className,
}: {
  event: AuditEventListItem;
  render: (change: NonNullable<AuditEventListItem['changes']>[number]) => string;
  className?: string;
}) {
  const changes = event.changes ?? [];

  if (!changes.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  const hidden = changes.length - VISIBLE_CHANGES;

  return (
    <ul className="space-y-1">
      {changes.slice(0, VISIBLE_CHANGES).map((change) => {
        const text = render(change);
        return (
          <li key={change.field} title={text} className={cn('h-5 max-w-52 truncate', className)}>
            {text}
          </li>
        );
      })}
      {hidden > 0 ? (
        <li className="text-muted-foreground h-5 text-xs leading-5">{`+${hidden} more`}</li>
      ) : null}
    </ul>
  );
}

function EventCards({ events, timeZone, onOpen }: RowProps & { events: AuditEventListItem[] }) {
  return (
    <ul className="divide-y md:hidden" aria-label="Audit Events">
      {events.map((event) => (
        <li key={event.id} className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{actionLabel(event.action)}</p>
              <p className="text-muted-foreground text-xs">
                {event.module} · {recordTypeLabel(event.entityType)}
                {event.entityLabel ? ` ${event.entityLabel}` : ''}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {event.actorName}
                {event.actorRoles ? ` · ${event.actorRoles}` : ''}
              </p>
              {event.patient ? (
                <p className="text-muted-foreground font-mono text-xs">
                  {patientName(event)} · {event.patient.mrn}
                </p>
              ) : null}
              {event.changes?.length ? (
                <p className="text-muted-foreground text-xs">
                  {formatCount(event.changes.length, 'field')} changed
                </p>
              ) : null}
            </div>
            <OperationBadge operation={event.operation} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground font-mono text-xs">
              {formatAuditTime(event.occurredOn, timeZone)}
            </span>
            <OpenButton event={event} onOpen={onOpen} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EventRow({ event, timeZone, onOpen }: RowProps & { event: AuditEventListItem }) {
  const when = splitAuditTime(event.occurredOn, timeZone);
  const device = describeDevice(event.userAgent);
  const operator = impersonatedBy(event);
  const details = eventDetails(event);

  return (
    <TableRow className="align-top">
      <TableCell className="pl-4 whitespace-nowrap">
        <p className="font-medium">{when.date}</p>
        <p className="text-muted-foreground font-mono text-xs">{when.time}</p>
      </TableCell>
      <TableCell className="max-w-56">
        <p className="truncate font-medium">{event.actorName}</p>
        <p className="text-muted-foreground truncate text-xs">{event.actorEmail}</p>
        {event.actorRoles ? (
          <p className="text-muted-foreground truncate text-xs" title={event.actorRoles}>
            {event.actorRoles}
          </p>
        ) : null}
        {operator ? (
          <p className="text-destructive truncate text-xs">Support access: {operator}</p>
        ) : null}
      </TableCell>
      <TableCell className="whitespace-nowrap">{event.module}</TableCell>
      <TableCell>
        <OperationBadge operation={event.operation} />
      </TableCell>
      <TableCell className="max-w-52">
        <p className="font-medium">{actionLabel(event.action)}</p>
        <p className="text-muted-foreground truncate font-mono text-xs">{event.action}</p>
      </TableCell>
      <TableCell className="max-w-48">
        <p className="truncate">{recordTypeLabel(event.entityType)}</p>
        <p className="text-muted-foreground truncate font-mono text-xs">
          {event.entityLabel ?? (event.entityId ? `#${event.entityId}` : '—')}
        </p>
      </TableCell>
      <TableCell className="max-w-56">
        {event.patient ? (
          <>
            <Link
              href={`/patients/${event.patient.id}`}
              className="hover:text-primary block truncate font-medium hover:underline"
            >
              {patientName(event)}
            </Link>
            <p className="text-muted-foreground font-mono text-xs">{event.patient.mrn}</p>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {event.visitId ? (
          <Link
            href={`/visits/${event.visitId}`}
            className="hover:text-primary font-mono text-xs hover:underline"
          >
            #{event.visitId}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <ChangeLines event={event} className="font-medium" render={(change) => change.label} />
      </TableCell>
      <TableCell>
        <ChangeLines
          event={event}
          className="text-muted-foreground"
          render={(change) => formatChangeValue(change.from)}
        />
      </TableCell>
      <TableCell>
        <ChangeLines event={event} render={(change) => formatChangeValue(change.to)} />
      </TableCell>
      <TableCell className="text-muted-foreground max-w-64">
        <p className="line-clamp-3 whitespace-normal" title={details ?? undefined}>
          {details ?? '—'}
        </p>
      </TableCell>
      <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
        {event.ipAddress ?? '—'}
      </TableCell>
      <TableCell
        className="text-muted-foreground text-xs whitespace-nowrap"
        title={event.userAgent ?? undefined}
      >
        {device ?? '—'}
      </TableCell>
      <TableCell className="pr-4 text-right">
        <OpenButton event={event} onOpen={onOpen} />
      </TableCell>
    </TableRow>
  );
}

function TableHeadings() {
  return (
    <TableHeader>
      <TableRow>
        {COLUMNS.map((column, index) => (
          <TableHead key={column} className={cn('whitespace-nowrap', index === 0 && 'pl-4')}>
            {column}
          </TableHead>
        ))}
        <TableHead className="pr-4 text-right">
          <span className="sr-only">Open</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

function EventTable({ events, timeZone, onOpen }: RowProps & { events: AuditEventListItem[] }) {
  return (
    <div className="hidden md:block">
      <Table className={TABLE_MIN_WIDTH}>
        <TableHeadings />
        <TableBody>
          {events.map((event) => (
            <EventRow key={event.id} event={event} timeZone={timeZone} onOpen={onOpen} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AuditLogTable({
  events,
  total,
  page,
  totalPages,
  timeZone,
  isFetching,
  onOpen,
  onPageChange,
}: RowProps & {
  events: AuditEventListItem[];
  total: number;
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (next: number) => void;
}) {
  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <div className={cn(isFetching && 'opacity-70 transition-opacity')}>
          <EventCards events={events} timeZone={timeZone} onOpen={onOpen} />
          <EventTable events={events} timeZone={timeZone} onOpen={onOpen} />
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            {formatCount(total, 'event')}
            {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
          </p>
          {totalPages > 1 ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// Per-column skeleton widths, in the same order as COLUMNS: [first line, second line or null].
const SKELETON_CELLS: [string, string | null][] = [
  ['w-24', 'w-16'],
  ['w-28', 'w-36'],
  ['w-16', null],
  ['w-20', null],
  ['w-32', 'w-24'],
  ['w-24', 'w-20'],
  ['w-32', 'w-20'],
  ['w-12', null],
  ['w-24', 'w-20'],
  ['w-28', 'w-24'],
  ['w-28', 'w-24'],
  ['w-40', null],
  ['w-24', null],
  ['w-24', null],
];

// Mirrors both layouts of the loaded list: the phone cards and the desktop table, with the same
// header, one sized skeleton per cell, and the count footer.
export function AuditLogTableSkeleton() {
  return (
    <Card className="py-0" aria-label="Loading the Audit Log">
      <CardContent className="p-0">
        <ul className="divide-y md:hidden" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="size-9" />
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Table className={TABLE_MIN_WIDTH}>
            <TableHeadings />
            <TableBody>
              {Array.from({ length: AUDIT_LOG_PAGE_SIZE }, (_, row) => (
                <TableRow key={row}>
                  {SKELETON_CELLS.map(([first, second], index) => (
                    <TableCell key={index} className={cn(index === 0 && 'pl-4')}>
                      <div className="space-y-1.5">
                        <Skeleton className={cn('h-4', first)} />
                        {second ? <Skeleton className={cn('h-3', second)} /> : null}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="pr-4">
                    <Skeleton className="ml-auto size-9" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t p-3">
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
