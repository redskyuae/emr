'use client';

import Link from 'next/link';
import { Eye, Loader2, MoreHorizontal, PlayCircle, XCircle } from 'lucide-react';

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
import { isActiveVisit, visitStatusPresentation, waitingLabel } from '../_utils/visit-status';

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
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PlayCircle className="size-4" />
          )}
          {isPending ? 'Starting…' : 'Start'}
        </Button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${visit.visitNumber}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/visits/${visit.id}`}>
              <Eye className="size-4" />
              View Visit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/patients/${visit.patient.id}`}>
              <Eye className="size-4" />
              Open Patient
            </Link>
          </DropdownMenuItem>
          {isActiveVisit(visit.status) && canCancel ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onCancel(visit)}>
                <XCircle className="size-4" />
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
          const status = visitStatusPresentation(visit.status);

          return (
            <li key={visit.id} className="bg-card shadow-fluent-2 space-y-3 rounded-xl border p-4">
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
                  <p className="text-muted-foreground text-xs">{visit.doctor.name}</p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
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

      <div className="bg-card shadow-fluent-2 hidden overflow-hidden rounded-xl border md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-muted-foreground bg-muted/60 border-b text-left text-xs tracking-wider uppercase">
                <th className="p-3 pl-5 font-semibold">Token</th>
                <th className="p-3 font-semibold">Visit</th>
                <th className="p-3 font-semibold">Patient</th>
                <th className="p-3 font-semibold">Doctor</th>
                <th className="p-3 font-semibold">Type</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Checked in</th>
                <th className="p-3 pr-5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => {
                const status = visitStatusPresentation(visit.status);

                return (
                  <tr key={visit.id} className="hover:bg-muted/50 border-b last:border-b-0">
                    <td className="px-3 py-3.5 pl-5">
                      <span className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-md text-base font-semibold tabular-nums">
                        {visit.queueToken}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
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
                    <td className="px-3 py-3.5">
                      <p className="font-medium">
                        {visit.patient.firstName} {visit.patient.lastName}
                      </p>
                      <p className="text-muted-foreground text-xs">{visit.patient.mrn}</p>
                    </td>
                    <td className="px-3 py-3.5">{visit.doctor.name}</td>
                    <td className="px-3 py-3.5">
                      <Badge variant="secondary">{visit.visitType.code}</Badge>
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="text-muted-foreground px-3 py-3.5 tabular-nums">
                      {formatTime(visit.checkedInAt)}
                      {visit.status === 'CHECKED_IN' ? (
                        <p className="text-xs">{waitingLabel(visit.checkedInAt, now)}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3.5 pr-5 text-right">
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

export function VisitsTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-xl border p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="ml-auto h-8 w-28" />
        </div>
      ))}
    </div>
  );
}
