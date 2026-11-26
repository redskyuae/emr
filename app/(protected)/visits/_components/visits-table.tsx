'use client';

import Link from 'next/link';
import { CiCircleRemove, CiRead } from 'react-icons/ci';
import { PiCircleNotchLight, PiDotsThreeLight, PiPlayCircleLight } from 'react-icons/pi';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import {
  VISITS_PAGE_SIZE,
  isActiveVisit,
  visitListStatusPresentation,
  waitingLabel,
} from '../_utils/visit-status';
import { visitDoctorLabel } from '@/lib/visit-doctor-label';
import { cn } from '@/lib/utils';

function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

type VisitRowProps = {
  pendingVisitId: number | null;
  canStart: boolean;
  canCancel: boolean;
  onStart: (visit: Visit) => void;
  onCancel: (visit: Visit) => void;
};

function VisitRowActions({
  visit,
  pendingVisitId,
  canStart,
  canCancel,
  onStart,
  onCancel,
}: VisitRowProps & { visit: Visit }) {
  const isPending = pendingVisitId === visit.id;

  return (
    <div className="flex items-center justify-end gap-2">
      {visit.status === 'CHECKED_IN' && canStart ? (
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          aria-busy={isPending}
          onClick={() => onStart(visit)}
        >
          {isPending ? (
            <PiCircleNotchLight className="size-4 animate-spin" />
          ) : (
            <PiPlayCircleLight className="size-4" />
          )}
          {isPending ? 'Starting…' : 'Start'}
        </Button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${visit.visitNumber}`}>
            <PiDotsThreeLight className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/visits/${visit.id}`}>
              <CiRead className="size-4" />
              View Visit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/patients/${visit.patient.id}`}>
              <CiRead className="size-4" />
              Open Patient
            </Link>
          </DropdownMenuItem>
          {isActiveVisit(visit.status) && canCancel ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onCancel(visit)}>
                <CiCircleRemove className="size-4" />
                Cancel Visit
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function VisitsTable({
  visits,
  now,
  ...rowProps
}: VisitRowProps & {
  visits: Visit[];
  now: number;
}) {
  return (
    <>
      <ul className="space-y-3 md:hidden" aria-label="Visits">
        {visits.map((visit) => {
          const status = visitListStatusPresentation(visit);

          return (
            <li key={visit.id} className="bg-card space-y-3 rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-md text-base font-semibold tabular-nums">
                  {visit.queueToken}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/visits/${visit.id}`} className="font-medium hover:underline">
                    {visit.patient.firstName} {visit.patient.lastName}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {visit.patient.mrn} · {visit.visitNumber}
                  </p>
                  <p className="text-muted-foreground text-xs">{visitDoctorLabel(visit)}</p>
                </div>
                <Badge variant={status.variant} className={status.className}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs tabular-nums">
                  {visit.status === 'CHECKED_IN'
                    ? waitingLabel(visit.checkedInAt, now)
                    : formatTime(visit.checkedInAt)}
                </span>
                <VisitRowActions visit={visit} {...rowProps} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="bg-card hidden overflow-hidden rounded-xl border md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeadCellClass}>Token</th>
                <th className={tableHeadCellClass}>Visit</th>
                <th className={tableHeadCellClass}>Patient</th>
                <th className={tableHeadCellClass}>Doctor</th>
                <th className={tableHeadCellClass}>Type</th>
                <th className={tableHeadCellClass}>Status</th>
                <th className={tableHeadCellClass}>Checked in</th>
                <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => {
                const status = visitListStatusPresentation(visit);

                return (
                  <tr key={visit.id} className="hover:bg-muted/50 border-b last:border-b-0">
                    <td className={tableCellClass}>
                      <span className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-md text-base font-semibold tabular-nums">
                        {visit.queueToken}
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <Link href={`/visits/${visit.id}`} className="font-medium hover:underline">
                        {visit.visitNumber}
                      </Link>
                      {visit.appointment ? (
                        <p className="text-muted-foreground text-xs">
                          {visit.appointment.bookingNumber}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-xs">Walk-in</p>
                      )}
                    </td>
                    <td className={tableCellClass}>
                      <p className="font-medium">
                        {visit.patient.firstName} {visit.patient.lastName}
                      </p>
                      <p className="text-muted-foreground text-xs">{visit.patient.mrn}</p>
                    </td>
                    <td className={tableCellClass}>{visitDoctorLabel(visit)}</td>
                    <td className={tableCellClass}>
                      <Badge variant="secondary">{visit.visitType.code}</Badge>
                    </td>
                    <td className={tableCellClass}>
                      <Badge variant={status.variant} className={status.className}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className={cn(tableCellClass, 'text-muted-foreground tabular-nums')}>
                      {formatTime(visit.checkedInAt)}
                      {visit.status === 'CHECKED_IN' ? (
                        <p className="text-xs">{waitingLabel(visit.checkedInAt, now)}</p>
                      ) : null}
                    </td>
                    <td className={cn(tableCellClass, 'text-right')}>
                      <VisitRowActions visit={visit} {...rowProps} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// Mirrors both layouts of the loaded Visits: the phone card list and the desktop table, with the
// same header and one sized skeleton per cell.
export function VisitsTableSkeleton() {
  return (
    <>
      <ul className="space-y-3 md:hidden" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index} className="bg-card space-y-3 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="size-9 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="size-9" />
            </div>
          </li>
        ))}
      </ul>

      <div className="bg-card hidden overflow-hidden rounded-xl border md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeadCellClass}>Token</th>
                <th className={tableHeadCellClass}>Visit</th>
                <th className={tableHeadCellClass}>Patient</th>
                <th className={tableHeadCellClass}>Doctor</th>
                <th className={tableHeadCellClass}>Type</th>
                <th className={tableHeadCellClass}>Status</th>
                <th className={tableHeadCellClass}>Checked in</th>
                <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: VISITS_PAGE_SIZE }, (_, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <Skeleton className="size-9 rounded-md" />
                  </td>
                  <td className={tableCellClass}>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className={tableCellClass}>
                    <Skeleton className="ml-auto size-9" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
