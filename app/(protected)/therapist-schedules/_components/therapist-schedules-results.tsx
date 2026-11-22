'use client';

import { CiCircleAlert } from 'react-icons/ci';
import { PiPlusLight, PiCalendarBlankDuotone, PiMagnifyingGlassDuotone } from 'react-icons/pi';

import type { TherapistSchedule } from '@/app/api/lib/modules/therapist-schedule/schemas/therapist-schedule-schema';
import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
  /** The Therapist or date range is narrowing the list, as the query applies it. */
  isFiltered: boolean;
  /** The user may create, so the "nothing yet" state offers New Therapist Schedule. */
  canCreate: boolean;
  onAddSchedule: () => void;
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
  isFiltered,
  canCreate,
  onAddSchedule,
}: Props) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
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
  const viewProps = { schedules, therapistNameById, canEdit, onEdit };

  return (
    <SkeletonCrossfade
      isLoading={isLoading}
      skeleton={<TherapistScheduleViewSkeleton layout={layout} canEdit={canEdit} />}
    >
      {schedules.length === 0 ? (
        isFiltered ? (
          <EmptyState
            tone="neutral"
            title="No results found"
            icon={PiMagnifyingGlassDuotone}
            className="bg-card min-h-72 border"
            description="No Therapist Schedules match the Therapist and date filters."
          />
        ) : (
          <EmptyState
            tone="teal"
            icon={PiCalendarBlankDuotone}
            title="No Therapist Schedules yet"
            className="bg-card min-h-72 border"
            description="Create a Therapist Schedule to get started."
            actions={
              canCreate ? (
                <Button type="button" onClick={onAddSchedule}>
                  <PiPlusLight className="size-4" />
                  New Therapist Schedule
                </Button>
              ) : null
            }
          />
        )
      ) : (
        <div className="space-y-4">
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
        </div>
      )}
    </SkeletonCrossfade>
  );
}
