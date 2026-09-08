'use client';

import Link from 'next/link';
import { CheckCircle2, Eye, MoreHorizontal, PlayCircle, XCircle } from 'lucide-react';

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
import { isActiveVisit, visitStatusPresentation } from '../_utils/visit-status';

function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function VisitsTable({
  visits,
  pendingVisitId,
  canStart,
  canComplete,
  canCancel,
  onStart,
  onComplete,
  onCancel,
}: {
  visits: Visit[];
  pendingVisitId: number | null;
  canStart: boolean;
  canComplete: boolean;
  canCancel: boolean;
  onStart: (visit: Visit) => void;
  onComplete: (visit: Visit) => void;
  onCancel: (visit: Visit) => void;
}) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="p-3 pl-4 font-medium">Token</th>
              <th className="p-3 font-medium">Visit</th>
              <th className="p-3 font-medium">Patient</th>
              <th className="p-3 font-medium">Doctor</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Checked in</th>
              <th className="p-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => {
              const status = visitStatusPresentation(visit.status);
              const isPending = pendingVisitId === visit.id;

              return (
                <tr key={visit.id} className="hover:bg-muted/50 border-b last:border-b-0">
                  <td className="p-3 pl-4">
                    <span className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-md text-base font-semibold tabular-nums">
                      {visit.queueToken}
                    </span>
                  </td>
                  <td className="p-3">
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
                  <td className="p-3">
                    <p className="font-medium">
                      {visit.patient.firstName} {visit.patient.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">{visit.patient.mrn}</p>
                  </td>
                  <td className="p-3">{visit.doctor.name}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{visit.visitType.code}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="text-muted-foreground p-3 tabular-nums">
                    {formatTime(visit.checkedInAt)}
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {visit.status === 'CHECKED_IN' && canStart ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending}
                          onClick={() => onStart(visit)}
                        >
                          <PlayCircle className="size-4" />
                          Start
                        </Button>
                      ) : null}

                      {visit.status === 'IN_CONSULTATION' && canComplete ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending}
                          onClick={() => onComplete(visit)}
                        >
                          <CheckCircle2 className="size-4" />
                          Complete
                        </Button>
                      ) : null}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${visit.visitNumber}`}
                          >
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
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => onCancel(visit)}
                              >
                                <XCircle className="size-4" />
                                Cancel Visit
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function VisitsTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
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
