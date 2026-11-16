'use client';

import Link from 'next/link';
import { Eye, UserRound } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
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
import { cn } from '@/lib/utils';
import { visitStatusPresentation } from '../../visits/_utils/visit-status';
import { formatVisitDay } from '../_utils/previous-visits-filters';

function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function patientName(visit: Visit) {
  return `${visit.patient.firstName} ${visit.patient.lastName}`;
}

function VisitActions({ visit }: { visit: Visit }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="outline" size="sm">
        <Link href={`/visits/${visit.id}`}>
          <Eye className="size-4" />
          View
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" aria-label={`Open Patient ${patientName(visit)}`}>
        <Link href={`/patients/${visit.patient.id}`}>
          <UserRound className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

function VisitCards({ visits }: { visits: Visit[] }) {
  return (
    <ul className="divide-y md:hidden" aria-label="Previous Visits">
      {visits.map((visit) => {
        const status = visitStatusPresentation(visit.status);

        return (
          <li key={visit.id} className="space-y-3 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/visits/${visit.id}`} className="font-medium hover:underline">
                  {patientName(visit)}
                </Link>
                <p className="text-muted-foreground font-mono text-xs">
                  {visit.patient.mrn} · {visit.visitNumber}
                  {visit.legacyVisitNumber ? ` · Legacy #${visit.legacyVisitNumber}` : ''}
                </p>
                <p className="text-muted-foreground text-xs">
                  {visit.doctor.name} · {visit.visitType.name}
                </p>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground font-mono text-xs">
                {formatVisitDay(visit.visitDate)} · {formatTime(visit.checkedInAt)}
              </span>
              <VisitActions visit={visit} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function VisitTable({ visits }: { visits: Visit[] }) {
  return (
    <div className="hidden md:block">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Date</TableHead>
            <TableHead>Visit</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Visit Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((visit) => {
            const status = visitStatusPresentation(visit.status);

            return (
              <TableRow key={visit.id}>
                <TableCell className="pl-4">
                  <p className="font-medium">{formatVisitDay(visit.visitDate)}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    Checked in {formatTime(visit.checkedInAt)}
                  </p>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/visits/${visit.id}`}
                    className="hover:text-primary font-mono font-medium hover:underline"
                  >
                    {visit.visitNumber}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {visit.appointment ? visit.appointment.bookingNumber : 'Walk-in'}
                  </p>
                  {visit.legacyVisitNumber ? (
                    <p className="text-muted-foreground font-mono text-xs">
                      Legacy #{visit.legacyVisitNumber}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{patientName(visit)}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {visit.patient.mrn} · {visit.patient.phone}
                  </p>
                </TableCell>
                <TableCell>{visit.doctor.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" title={visit.visitType.name}>
                    {visit.visitType.code}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <VisitActions visit={visit} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function PreviousVisitsTable({
  visits,
  total,
  page,
  totalPages,
  isFetching,
  onPageChange,
}: {
  visits: Visit[];
  total: number;
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (next: number) => void;
}) {
  return (
    <Card className="shadow-fluent-2 py-0">
      <CardContent className="p-0">
        <div className={cn(isFetching && 'opacity-70 transition-opacity')}>
          <VisitCards visits={visits} />
          <VisitTable visits={visits} />
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? 'Visit' : 'Visits'}
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

export function PreviousVisitsTableSkeleton() {
  return (
    <Card className="shadow-fluent-2 py-0" aria-label="Loading Previous Visits">
      <CardContent className="space-y-2 p-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
