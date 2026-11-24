'use client';

import { useEffect, useRef, type MouseEvent } from 'react';
import Link from 'next/link';
import { PiCaretDownLight } from 'react-icons/pi';

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
import { AuditEventDetails } from './audit-event-details';
import { useExpandReveal } from './use-expand-reveal';

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

// The expand/collapse chevron leads each row; the button's own padding stands in for the cell's,
// and the negative margin lines the 36px button up with the first line of the row's text.
const TOGGLE_CELL = 'w-12 pr-0 first:pl-3 [&>button]:-my-2';

type RowProps = {
  timeZone: string | undefined;
  expandedId: number | null;
  onToggle: (event: AuditEventListItem) => void;
};

// The phone cards and the desktop table are both in the DOM, so each layout gets its own id.
type Layout = 'card' | 'row';
const detailsId = (event: AuditEventListItem, layout: Layout) =>
  `audit-event-${event.id}-${layout}-details`;

/**
 * Clicking anywhere on a row or card toggles its details, except on its own links and buttons,
 * and except when the click ends a text selection (reviewers copy values out of the log).
 */
function toggleOnClick(event: AuditEventListItem, onToggle: RowProps['onToggle']) {
  return (click: MouseEvent<HTMLElement>) => {
    if ((click.target as HTMLElement).closest('a, button')) return;
    if (window.getSelection()?.toString()) return;
    onToggle(event);
  };
}

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

function ToggleButton({
  event,
  layout,
  expanded,
  onToggle,
}: {
  event: AuditEventListItem;
  layout: Layout;
  expanded: boolean;
  onToggle: RowProps['onToggle'];
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-expanded={expanded}
      aria-controls={expanded ? detailsId(event, layout) : undefined}
      aria-label={`Details of ${actionLabel(event.action)} by ${event.actorName}`}
      onClick={() => onToggle(event)}
    >
      <PiCaretDownLight
        className={cn(
          'size-4 transition-transform duration-300 motion-reduce:transition-none',
          expanded && 'rotate-180'
        )}
      />
    </Button>
  );
}

/**
 * One line per changed field, in the same order and height in the Field, Old value and New value
 * columns so they read across. Extra changes are counted on a last line and shown in full in the
 * row's details.
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

function EventCard({
  event,
  timeZone,
  expandedId,
  onToggle,
}: RowProps & { event: AuditEventListItem }) {
  const expanded = event.id === expandedId;
  const { ref: revealRef, rendered: revealed } = useExpandReveal<HTMLDivElement>(expanded);

  return (
    <li className={cn('transition-colors', expanded && 'bg-muted/40')}>
      <div className="cursor-pointer space-y-2 p-3" onClick={toggleOnClick(event, onToggle)}>
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
          <ToggleButton event={event} layout="card" expanded={expanded} onToggle={onToggle} />
        </div>
      </div>
      {revealed ? (
        <div ref={revealRef} id={detailsId(event, 'card')} className="overflow-hidden">
          <div className="border-t">
            <AuditEventDetails event={event} timeZone={timeZone} />
          </div>
        </div>
      ) : null}
    </li>
  );
}

function EventCards({ events, ...rowProps }: RowProps & { events: AuditEventListItem[] }) {
  return (
    <ul className="divide-y md:hidden" aria-label="Audit Events">
      {events.map((event) => (
        <EventCard key={event.id} event={event} {...rowProps} />
      ))}
    </ul>
  );
}

function EventRow({
  event,
  timeZone,
  expandedId,
  onToggle,
}: RowProps & { event: AuditEventListItem }) {
  const expanded = event.id === expandedId;
  const { ref: revealRef, rendered: revealed } = useExpandReveal<HTMLDivElement>(expanded);
  const when = splitAuditTime(event.occurredOn, timeZone);
  const device = describeDevice(event.userAgent);
  const operator = impersonatedBy(event);
  const details = eventDetails(event);

  return (
    <>
      <TableRow className="cursor-pointer align-top" onClick={toggleOnClick(event, onToggle)}>
        <TableCell className={TOGGLE_CELL}>
          <ToggleButton event={event} layout="row" expanded={expanded} onToggle={onToggle} />
        </TableCell>
        <TableCell className="whitespace-nowrap">
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
          className="text-muted-foreground pr-4 text-xs whitespace-nowrap"
          title={event.userAgent ?? undefined}
        >
          {device ?? '—'}
        </TableCell>
      </TableRow>
      {revealed ? (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell
            colSpan={COLUMNS.length + 1}
            className="p-0 align-top whitespace-normal first:pl-0 last:pr-0"
          >
            {/* Pinned to the visible part of the sideways-scrolling table, so the details are
              never pushed off screen by the table's width. */}
            <div
              ref={revealRef}
              id={detailsId(event, 'row')}
              className="sticky left-0 w-(--audit-table-viewport,100%) overflow-hidden"
            >
              <AuditEventDetails event={event} timeZone={timeZone} />
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function TableHeadings() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className={TOGGLE_CELL}>
          <span className="sr-only">Details</span>
        </TableHead>
        {COLUMNS.map((column, index) => (
          <TableHead
            key={column}
            className={cn('whitespace-nowrap', index === COLUMNS.length - 1 && 'pr-4')}
          >
            {column}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function EventTable({ events, ...rowProps }: RowProps & { events: AuditEventListItem[] }) {
  const ref = useRef<HTMLDivElement>(null);

  // Publish the visible width of the table as a CSS variable for the pinned details panel.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      el.style.setProperty('--audit-table-viewport', `${entry.contentRect.width}px`);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="hidden md:block">
      <Table className={TABLE_MIN_WIDTH}>
        <TableHeadings />
        <TableBody>
          {events.map((event) => (
            <EventRow key={event.id} event={event} {...rowProps} />
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
  expandedId,
  onToggle,
  onPageChange,
}: RowProps & {
  events: AuditEventListItem[];
  total: number;
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (next: number) => void;
}) {
  const rowProps = { events, timeZone, expandedId, onToggle };

  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <div className={cn(isFetching && 'opacity-70 transition-opacity')}>
          <EventCards {...rowProps} />
          <EventTable {...rowProps} />
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
                  <TableCell className={TOGGLE_CELL}>
                    <Skeleton className="size-9" />
                  </TableCell>
                  {SKELETON_CELLS.map(([first, second], index) => (
                    <TableCell
                      key={index}
                      className={cn(index === SKELETON_CELLS.length - 1 && 'pr-4')}
                    >
                      <div className="space-y-1.5">
                        <Skeleton className={cn('h-4', first)} />
                        {second ? <Skeleton className={cn('h-3', second)} /> : null}
                      </div>
                    </TableCell>
                  ))}
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
