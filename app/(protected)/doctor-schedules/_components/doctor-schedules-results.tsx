'use client';

import { CiCircleAlert } from 'react-icons/ci';
import { PiPlusLight, PiCalendarBlankDuotone, PiMagnifyingGlassDuotone } from 'react-icons/pi';

import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import type { DoctorSchedule } from '@/app/api/lib/modules/doctor-schedule/schemas/doctor-schedule-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
  /** The Doctor or date range is narrowing the list, as the query applies it. */
  isFiltered: boolean;
  /** The user may create, so the "nothing yet" state offers New Doctor Schedule. */
  canCreate: boolean;
  onAddSchedule: () => void;
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
  isFiltered,
  canCreate,
  onAddSchedule,
}: DoctorSchedulesResultsProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
        <AlertTitle>Could not load Doctor Schedules</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  const doctorNameById = buildDoctorNameMap(doctors);
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * (meta?.pageSize ?? 10) + 1 : 0;
  const rangeEnd = Math.min(page * (meta?.pageSize ?? 10), total);
  const viewProps = { schedules, doctorNameById, canEdit, onEdit };

  return (
    <SkeletonCrossfade
      isLoading={isLoading}
      skeleton={<DoctorScheduleViewSkeleton layout={layout} canEdit={canEdit} />}
    >
      {schedules.length === 0 ? (
        isFiltered ? (
          <EmptyState
            tone="neutral"
            title="No results found"
            icon={PiMagnifyingGlassDuotone}
            className="bg-card min-h-72 border"
            description="No Doctor Schedules match the Doctor and date filters."
          />
        ) : (
          <EmptyState
            tone="teal"
            icon={PiCalendarBlankDuotone}
            title="No Doctor Schedules yet"
            className="bg-card min-h-72 border"
            description="Create a Doctor Schedule to get started."
            actions={
              canCreate ? (
                <Button type="button" onClick={onAddSchedule}>
                  <PiPlusLight className="size-4" />
                  New Doctor Schedule
                </Button>
              ) : null
            }
          />
        )
      ) : (
        <div className="space-y-4">
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
        </div>
      )}
    </SkeletonCrossfade>
  );
}
