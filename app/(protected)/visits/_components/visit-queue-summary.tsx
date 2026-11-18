'use client';

import type { IconType } from 'react-icons';
import { CiCircleCheck, CiCircleRemove, CiClock1, CiStethoscope } from 'react-icons/ci';

import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
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
  visitDate,
  doctorId,
  selected,
  onToggle,
}: {
  label: string;
  status: VisitStatus;
  visitDate: string;
  doctorId: number | undefined;
  selected: boolean;
  onToggle: () => void;
}) {
  const countQuery = useVisitsQuery({ visitDate, doctorId, status, page: 1, limit: 1 });
  const { icon, tone } = STATUS_ICONS[status];

  return (
    <StatCard
      label={label}
      icon={icon}
      tone={tone}
      pressed={selected}
      onPress={onToggle}
      value={
        countQuery.isLoading ? (
          <Skeleton className="h-7.5 w-8" aria-label={`Loading ${label} count`} />
        ) : countQuery.isError ? (
          '—'
        ) : (
          (countQuery.data?.meta.total ?? 0)
        )
      }
    />
  );
}

export function VisitQueueSummary({
  visitDate,
  doctorId,
  status,
  onStatusChange,
}: {
  visitDate: string;
  doctorId: number | undefined;
  status: string | undefined;
  onStatusChange: (status: VisitStatus | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Visits by status">
      {VISIT_STATUS_FILTERS.map((filter) => (
        <QueueTile
          key={filter.value}
          label={filter.label}
          status={filter.value}
          visitDate={visitDate}
          doctorId={doctorId}
          selected={status === filter.value}
          onToggle={() => onStatusChange(status === filter.value ? null : filter.value)}
        />
      ))}
    </div>
  );
}
