'use client';

import Link from 'next/link';
import { CiEdit, CiRead, CiUser } from 'react-icons/ci';
import { PiDotsThreeLight } from 'react-icons/pi';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { PREVIOUS_VISITS_PAGE_SIZE, formatVisitDay } from '../_utils/previous-visits-filters';
import { visitDoctorLabel } from '@/lib/visit-doctor-label';
import { visitEditHref } from '../_utils/visit-edit-href';

function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function patientName(visit: Visit) {
  return `${visit.patient.firstName} ${visit.patient.lastName}`;
}

type EditPermissions = Parameters<typeof visitEditHref>[1];

function VisitActions({ visit, permissions }: { visit: Visit; permissions: EditPermissions }) {
  const editHref = visitEditHref(visit, permissions);

  return (
    <div className="flex items-center justify-end">
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
          {editHref ? (
            <DropdownMenuItem asChild>
              <Link href={editHref}>
                <CiEdit className="size-4" />
                Edit Visit
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/patients/${visit.patient.id}`}>
              <CiUser className="size-4" />
              Open Patient
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function VisitCards({ visits, permissions }: { visits: Visit[]; permissions: EditPermissions }) {
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
                  {visitDoctorLabel(visit)} · {visit.visitType.name}
                </p>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground font-mono text-xs">
                {formatVisitDay(visit.visitDate)} · {formatTime(visit.checkedInAt)}
              </span>
              <VisitActions visit={visit} permissions={permissions} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function VisitTable({ visits, permissions }: { visits: Visit[]; permissions: EditPermissions }) {
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
                <TableCell>{visitDoctorLabel(visit)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" title={visit.visitType.name}>
                    {visit.visitType.code}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <VisitActions visit={visit} permissions={permissions} />
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
  const { data: canUpdate } = useHasPermission('visit:update');
  const { data: canAmend } = useHasPermission('visit:amend');
  const permissions = { canUpdate: Boolean(canUpdate), canAmend: Boolean(canAmend) };

  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <div className={cn(isFetching && 'opacity-70 transition-opacity')}>
          <VisitCards visits={visits} permissions={permissions} />
          <VisitTable visits={visits} permissions={permissions} />
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

// Mirrors both layouts of the loaded list: the phone cards and the desktop table, with the same
// header, one sized skeleton per cell, and the count footer.
export function PreviousVisitsTableSkeleton() {
  return (
    <Card className="py-0" aria-label="Loading Previous Visits">
      <CardContent className="p-0">
        <ul className="divide-y md:hidden" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index} className="space-y-3 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="size-9" />
              </div>
            </li>
          ))}
        </ul>

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
              {Array.from({ length: PREVIOUS_VISITS_PAGE_SIZE }, (_, index) => (
                <TableRow key={index}>
                  <TableCell className="pl-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end">
                      <Skeleton className="size-9" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t p-3">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
