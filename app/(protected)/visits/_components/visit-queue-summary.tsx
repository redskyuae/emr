'use client';

import { CheckCircle2, Clock3, Stethoscope, XCircle, type LucideIcon } from 'lucide-react';

import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { VISIT_STATUS_FILTERS } from '../_utils/visit-status';

const STATUS_ICONS: Record<VisitStatus, { icon: LucideIcon; tone: string }> = {
  CHECKED_IN: { icon: Clock3, tone: 'text-warning' },
  IN_CONSULTATION: { icon: Stethoscope, tone: 'text-primary' },
  COMPLETED: { icon: CheckCircle2, tone: 'text-success' },
  CANCELLED: { icon: XCircle, tone: 'text-destructive' },
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
  const { icon: Icon, tone } = STATUS_ICONS[status];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'bg-card shadow-fluent-2 hover:shadow-fluent-8 focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg border p-3 text-left transition-shadow outline-none focus-visible:ring-3',
        selected && 'border-primary ring-primary/20 ring-2'
      )}
    >
      <Icon className={cn('size-5 shrink-0', tone)} aria-hidden="true" />
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      {countQuery.isLoading ? (
        <Skeleton className="h-7 w-8" aria-label={`Loading ${label} count`} />
      ) : (
        <span className="font-heading text-2xl font-semibold tabular-nums">
          {countQuery.isError ? '—' : (countQuery.data?.meta.total ?? 0)}
        </span>
      )}
    </button>
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Visits by status">
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
