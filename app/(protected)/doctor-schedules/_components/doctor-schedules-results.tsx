'use client';

import { AlertCircle, CalendarClock } from 'lucide-react';

import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import type { DoctorSchedule } from '@/app/api/lib/modules/doctor-schedule/schemas/doctor-schedule-schema';
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
import { DoctorScheduleViewSkeleton } from './doctor-schedule-skeletons';
import {
  DoctorScheduleCardView,
  DoctorScheduleListView,
  DoctorScheduleTableView,
} from './doctor-schedule-views';
import type { ViewLayout } from './doctor-schedules-toolbar';

type DoctorSchedulesResultsProps = {
  page: number;
  error: unknown;
  doctors: Doctor[];
  isError: boolean;
  isLoading: boolean;
  isFetching: boolean;
  layout: ViewLayout;
  schedules: DoctorSchedule[];
  meta: Paginated<DoctorSchedule>['meta'] | undefined;
  onEdit: (schedule: DoctorSchedule) => void;
  onPageChange: (next: number) => void;
  canEdit: boolean;
};

function buildDoctorNameMap(doctors: Doctor[]) {
  return new Map(doctors.map((doctor) => [doctor.id, doctor.name]));
}

export function DoctorSchedulesResults({
  page,
  meta,
  error,
  layout,
  doctors,
  isError,
  onEdit,
  schedules,
  isLoading,
  isFetching,
  onPageChange,
  canEdit,
}: DoctorSchedulesResultsProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load Doctor Schedules</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <DoctorScheduleViewSkeleton layout={layout} />;
  }

  if (schedules.length === 0) {
    return (
      <Empty className="bg-card shadow-fluent-2 min-h-72 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarClock className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No Doctor Schedules found.</EmptyTitle>
          <EmptyDescription>
            Create a schedule or adjust the Doctor and date filters.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const doctorNameById = buildDoctorNameMap(doctors);
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * (meta?.pageSize ?? 10) + 1 : 0;
  const rangeEnd = Math.min(page * (meta?.pageSize ?? 10), total);
  const viewProps = { schedules, doctorNameById, canEdit, onEdit };

  return (
    <>
      <div className={cn(isFetching && 'opacity-70 transition-opacity')}>
        {layout === 'table' ? (
          <DoctorScheduleTableView {...viewProps} />
        ) : layout === 'card' ? (
          <DoctorScheduleCardView {...viewProps} />
        ) : (
          <DoctorScheduleListView {...viewProps} />
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
