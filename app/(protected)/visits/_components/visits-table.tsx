import Link from 'next/link';
import { Eye, Stethoscope } from 'lucide-react';

import type { VisitBoardRow } from '../_data/static-clinician-visits';
import { visitStatusPresentation } from '../_utils/visit-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VisitsTable({ visits }: { visits: VisitBoardRow[] }) {
  if (visits.length === 0) {
    return (
      <Empty className="bg-card shadow-fluent-2 min-h-64 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Eye />
          </EmptyMedia>
          <EmptyTitle>No demonstration Visits</EmptyTitle>
          <EmptyDescription>The static clinician workflow dataset is empty.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 text-muted-foreground border-b text-left">
            <th className="p-3 pl-4 font-medium">Token</th>
            <th className="p-3 font-medium">Visit</th>
            <th className="p-3 font-medium">Patient</th>
            <th className="p-3 font-medium">Doctor</th>
            <th className="p-3 font-medium">VisitType</th>
            <th className="p-3 font-medium">Visit Status</th>
            <th className="p-3 font-medium">Checked in</th>
            <th className="p-3 pr-4 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => {
            const status = visitStatusPresentation(visit.status);

            return (
              <tr key={visit.id} className="hover:bg-muted/40 border-b last:border-b-0">
                <td className="p-3 pl-4">
                  <span className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-md text-base font-semibold tabular-nums">
                    {visit.queueToken}
                  </span>
                </td>
                <td className="p-3">
                  <p className="font-mono text-sm font-semibold">{visit.visitNumber}</p>
                  <p className="text-muted-foreground text-xs">{visit.visitDate}</p>
                </td>
                <td className="p-3">
                  <p className="font-medium">{visit.patient.name}</p>
                  <p className="text-muted-foreground font-mono text-xs">{visit.patient.mrn}</p>
                </td>
                <td className="p-3">
                  <p>{visit.doctor.name}</p>
                  <p className="text-muted-foreground text-xs">{visit.doctor.specialty}</p>
                </td>
                <td className="p-3">
                  <Badge variant="secondary">{visit.visitType.code}</Badge>
                  <p className="text-muted-foreground mt-1 text-xs">{visit.visitType.name}</p>
                </td>
                <td className="p-3">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="text-muted-foreground p-3 font-mono text-xs tabular-nums">
                  {formatTime(visit.checkedInAt)}
                </td>
                <td className="p-3 pr-4 text-right">
                  <Button
                    asChild
                    size="sm"
                    variant={visit.status === 'COMPLETED' ? 'outline' : 'default'}
                  >
                    <Link href={visit.href}>
                      <Stethoscope className="size-4" aria-hidden="true" />
                      Open consultation
                    </Link>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function VisitsTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="ml-auto h-8 w-40" />
        </div>
      ))}
    </div>
  );
}
