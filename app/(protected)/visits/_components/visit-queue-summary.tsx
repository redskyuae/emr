'use client';

import type { IconType } from 'react-icons';
import { CiCircleCheck, CiCircleRemove, CiClock1, CiStethoscope } from 'react-icons/ci';

import type {
  VisitStatus,
  VisitStatusCounts,
} from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useVisitStatusCountsQuery } from '@/app/queries/visits/useVisitStatusCounts';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { StatCard, type StatTone } from '@/components/app/stat-card';
import { Skeleton } from '@/components/ui/skeleton';

import { VISIT_STATUS_FILTERS } from '../_utils/visit-status';

const STATUS_ICONS: Record<VisitStatus, { icon: IconType; tone: StatTone }> = {
  CHECKED_IN: { icon: CiClock1, tone: 'warning' },
  IN_CONSULTATION: { icon: CiStethoscope, tone: 'primary' },
  COMPLETED: { icon: CiCircleCheck, tone: 'success' },
  CANCELLED: { icon: CiCircleRemove, tone: 'destructive' },
};

function QueueTile({
  label,
  status,
  counts,
  isError,
  isLoading,
  selected,
  onToggle,
}: {
  label: string;
  status: VisitStatus;
  counts: VisitStatusCounts | undefined;
  isError: boolean;
  isLoading: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const { icon, tone } = STATUS_ICONS[status];

  return (
    <StatCard
      label={label}
      icon={icon}
      tone={tone}
      pressed={selected}
      onPress={onToggle}
      value={
        isError ? (
          '—'
        ) : (
          <SkeletonCrossfade
            isLoading={isLoading}
            skeleton={<Skeleton className="h-7.5 w-14" aria-label={`Loading ${label} count`} />}
          >
            {counts?.[status] ?? 0}
          </SkeletonCrossfade>
        )
      }
    />
  );
}

export function VisitQueueSummary({
  visitDate,
  doctorId,
  status,
  enabled = true,
  onStatusChange,
}: {
  visitDate: string;
  doctorId: number | undefined;
  status: string | undefined;
  /** False until the board knows whose Visits to count. */
  enabled?: boolean;
  onStatusChange: (status: VisitStatus | null) => void;
}) {
  // One request feeds every tile, so the counts always come from the same moment.
  const countsQuery = useVisitStatusCountsQuery({ visitDate, doctorId }, { enabled });

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Visits by status">
      {VISIT_STATUS_FILTERS.map((filter) => (
        <QueueTile
          key={filter.value}
          label={filter.label}
          status={filter.value}
          counts={countsQuery.data}
          isError={countsQuery.isError}
          isLoading={countsQuery.isPending}
          selected={status === filter.value}
          onToggle={() => onStatusChange(status === filter.value ? null : filter.value)}
        />
      ))}
    </div>
  );
}
