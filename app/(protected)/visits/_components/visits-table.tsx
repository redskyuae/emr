'use client';

import Link from 'next/link';
import { AlertCircle, ClipboardList, MoreVertical, Play, Square, Trash2, X } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
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
import { VisitStatusBadge } from './visit-status-badge';

type VisitsTableProps = {
  visits: Visit[];
  meta: Paginated<Visit>['meta'] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  page: number;
  onPageChange: (next: number) => void;
  onStart: (visit: Visit) => void;
  onComplete: (visit: Visit) => void;
  onCancel: (visit: Visit) => void;
  onDelete: (visit: Visit) => void;
};

function formatCheckedInTime(createdOn: Date | string) {
  return new Date(createdOn).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function VisitActionsMenu({
  visit,
  onStart,
  onComplete,
  onCancel,
  onDelete,
}: {
  visit: Visit;
  onStart: (visit: Visit) => void;
  onComplete: (visit: Visit) => void;
  onCancel: (visit: Visit) => void;
  onDelete: (visit: Visit) => void;
}) {
  const category = visit.status.category;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${visit.visitNumber}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/visits/${visit.id}`}>View details</Link>
        </DropdownMenuItem>
        {category === 'WAITING' ? (
          <DropdownMenuItem onClick={() => onStart(visit)}>
            <Play className="size-4" />
            Start
          </DropdownMenuItem>
        ) : null}
        {category === 'IN_PROGRESS' ? (
          <DropdownMenuItem onClick={() => onComplete(visit)}>
            <Square className="size-4" />
            Complete
          </DropdownMenuItem>
        ) : null}
        {category === 'WAITING' || category === 'IN_PROGRESS' ? (
          <DropdownMenuItem onClick={() => onCancel(visit)}>
            <X className="size-4" />
            Cancel
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(visit)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function VisitsTable({
  visits,
  meta,
  isLoading,
  isFetching,
  isError,
  error,
  page,
  onPageChange,
  onStart,
  onComplete,
  onCancel,
  onDelete,
}: VisitsTableProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load Visits</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;

  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </div>
        ) : visits.length === 0 ? (
          <Empty className="min-h-72 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No Visits found.</EmptyTitle>
              <EmptyDescription>
                Try a different search term or filter — or check in a new Visit.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className={cn('min-w-max', isFetching && 'opacity-70 transition-opacity')}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Visit #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Checked in</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="pl-4">
                        <Link
                          href={`/visits/${visit.id}`}
                          className="hover:text-primary font-mono text-sm hover:underline"
                        >
                          {visit.visitNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/patients/${visit.patient.id}`} className="hover:underline">
                          {visit.patient.name}
                        </Link>
                        <p className="text-muted-foreground font-mono text-xs">
                          {visit.patient.mrn}
                        </p>
                      </TableCell>
                      <TableCell>{visit.doctor?.name ?? '—'}</TableCell>
                      <TableCell>{visit.appointmentType.name}</TableCell>
                      <TableCell>
                        <VisitStatusBadge status={visit.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatCheckedInTime(visit.createdOn)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <VisitActionsMenu
                          visit={visit}
                          onStart={onStart}
                          onComplete={onComplete}
                          onCancel={onCancel}
                          onDelete={onDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
