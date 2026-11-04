'use client';

import { AlertCircle, CalendarClock } from 'lucide-react';

import type { TherapistSchedule } from '@/app/api/lib/modules/therapist-schedule/schemas/therapist-schedule-schema';
import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { TherapistScheduleViewSkeleton } from './therapist-schedule-skeletons';
import {
  TherapistScheduleCardView,
  TherapistScheduleListView,
  TherapistScheduleTableView,
} from './therapist-schedule-views';
import type { ViewLayout } from './therapist-schedules-toolbar';

type Props = {
  page: number;
  error: unknown;
  therapists: Therapist[];
  isError: boolean;
  isLoading: boolean;
  isFetching: boolean;
  canEdit: boolean;
  layout: ViewLayout;
  schedules: TherapistSchedule[];
  meta: Paginated<TherapistSchedule>['meta'] | undefined;
  onEdit: (schedule: TherapistSchedule) => void;
  onPageChange: (next: number) => void;
};

export function TherapistSchedulesResults({
  page,
  meta,
  error,
  layout,
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

  if (isLoading) {
    return <TherapistScheduleViewSkeleton layout={layout} />;
  }

  if (schedules.length === 0) {
    return (
      <Empty className="bg-card shadow-fluent-2 min-h-72 border">
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
    );
  }

  const therapistNameById = new Map(therapists.map(({ id, name }) => [id, name]));
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const pageSize = meta?.pageSize ?? 10;
  const rangeStart = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, total);
  const viewProps = { schedules, therapistNameById, canEdit, onEdit };

  return (
    <>
      <div className={cn(isFetching && 'opacity-70 transition-opacity')}>
        {layout === 'table' ? (
          <TherapistScheduleTableView {...viewProps} />
        ) : layout === 'card' ? (
          <TherapistScheduleCardView {...viewProps} />
        ) : (
          <TherapistScheduleListView {...viewProps} />
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
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
  );
}
