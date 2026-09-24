'use client';

import { AlertCircle, CalendarClock, Pencil } from 'lucide-react';

import type { TherapistSchedule } from '@/app/api/lib/modules/therapist-schedule/schemas/therapist-schedule-schema';
import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

type Props = {
  page: number;
  error: unknown;
  therapists: Therapist[];
  isError: boolean;
  isLoading: boolean;
  isFetching: boolean;
  canEdit: boolean;
  schedules: TherapistSchedule[];
  meta: Paginated<TherapistSchedule>['meta'] | undefined;
  onEdit: (schedule: TherapistSchedule) => void;
  onPageChange: (next: number) => void;
};

function formatDateRange(schedule: TherapistSchedule) {
  return schedule.slotFromDate === schedule.slotToDate
    ? schedule.slotFromDate
    : `${schedule.slotFromDate} to ${schedule.slotToDate}`;
}

export function TherapistSchedulesTable({
  page,
  meta,
  error,
  canEdit,
  onEdit,
  schedules,
  therapists,
  isError,
  isLoading,
  isFetching,
  onPageChange,
}: Props) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load Therapist Schedules</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  const therapistNameById = new Map(therapists.map(({ id, name }) => [id, name]));
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const pageSize = meta?.pageSize ?? 10;
  const rangeStart = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-11 w-full" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <Empty className="min-h-72 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarClock className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No Therapist Schedules found.</EmptyTitle>
              <EmptyDescription>
                Create a schedule or adjust the Therapist and date filters.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Table className={cn('min-w-max', isFetching && 'opacity-70 transition-opacity')}>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Therapist</TableHead>
                  <TableHead>Date range</TableHead>
                  <TableHead>Rotas</TableHead>
                  <TableHead>Slot duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10 pr-4" aria-label="Actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="pl-4 font-medium">
                      {therapistNameById.get(schedule.therapistId) ??
                        `Therapist #${schedule.therapistId}`}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatDateRange(schedule)}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">
                        {schedule.rotaDetails.map(({ rotaName }) => rotaName).join(', ')}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {schedule.rotaDetails.map(({ rotaTime }) => rotaTime).join(' · ')}
                      </p>
                    </TableCell>
                    <TableCell>{schedule.slotDurationMinutes} min</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          schedule.isActive
                            ? 'border-chart-4/20 bg-chart-4/10 text-chart-4'
                            : 'bg-muted/60 text-muted-foreground'
                        )}
                      >
                        {schedule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {canEdit ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit Therapist Schedule ${schedule.id}`}
                          onClick={() => onEdit(schedule)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
              <p className="text-muted-foreground text-sm">
                Showing {rangeStart}-{rangeEnd} of {total}
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
