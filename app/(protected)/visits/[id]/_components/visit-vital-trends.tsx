import { CiWarning } from 'react-icons/ci';
import { PiHeartbeatDuotone } from 'react-icons/pi';

import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { EmptyState } from '@/components/app/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { vitalTrends, type VitalTrend } from '../_utils/vital-trends';

function Sparkline({ series }: { series: number[] }) {
  if (series.length < 2) return <span className="w-12" aria-hidden="true" />;

  const min = Math.min(...series);
  const range = Math.max(...series) - min || 1;
  const points = series
    .map((value, index) => {
      const x = (index / (series.length - 1)) * 48;
      const y = 16 - ((value - min) / range) * 14;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width="48"
      height="18"
      viewBox="0 0 48 18"
      className="text-chart-4 shrink-0"
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function day(value: Date) {
  return value.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function moment(value: Date) {
  return value.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** The change since the reading before, with a warning when the value is out of range. */
function TrendChange({ trend, shared }: { trend: VitalTrend; shared: boolean }) {
  if (trend.change === null && !trend.attention) return null;

  return (
    <span
      className={cn(
        'flex flex-wrap items-center gap-1 text-xs tabular-nums',
        trend.attention ? 'text-warning font-semibold' : 'text-muted-foreground'
      )}
    >
      {trend.attention ? (
        <CiWarning className="size-3" aria-label="Outside the usual adult range" />
      ) : null}
      {trend.change ?? 'First reading'}
      {/* Without one shared "vs" date in the header, say which reading each change is against. */}
      {trend.previousAt && !shared ? (
        <span className="text-muted-foreground font-normal">
          vs <span className="font-mono">{day(trend.previousAt)}</span>
        </span>
      ) : null}
    </span>
  );
}

export function VisitVitalTrends({
  readings,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  layout = 'list',
}: {
  readings: PatientVitalSign[];
  loading: boolean;
  error: boolean;
  emptyTitle: string;
  emptyDescription: string;
  /** `list` suits the narrow context pane; `tiles` spreads the readings across a wide step. */
  layout?: 'list' | 'tiles';
}) {
  if (loading) return <Skeleton className="h-40 w-full" aria-label="Loading Vital Signs" />;
  if (error) return <p className="text-destructive text-sm">Vital Signs could not be loaded.</p>;

  const result = vitalTrends(readings);

  if (!result || result.trends.length === 0) {
    return (
      <EmptyState
        size="sm"
        tone="blue"
        title={emptyTitle}
        icon={PiHeartbeatDuotone}
        description={emptyDescription}
      />
    );
  }

  const shared = Boolean(result.previousAt);
  const latest = (
    <p className="text-muted-foreground text-xs">
      Latest <span className="font-mono tabular-nums">{moment(result.recordedAt)}</span>
      {result.previousAt ? (
        <>
          {' '}
          · vs <span className="font-mono tabular-nums">{moment(result.previousAt)}</span>
        </>
      ) : null}
    </p>
  );

  if (layout === 'tiles') {
    return (
      <div className="space-y-2">
        {latest}
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
          {result.trends.map((trend) => (
            <div
              key={trend.key}
              className="bg-muted flex items-end justify-between gap-2 rounded-md px-3 py-2.5"
            >
              <div className="min-w-0">
                <dt className="text-muted-foreground text-xs">{trend.label}</dt>
                <dd className="font-mono text-base font-semibold tabular-nums">{trend.value}</dd>
                <dd>
                  <TrendChange trend={trend} shared={shared} />
                </dd>
              </div>
              <dd>
                <Sparkline series={trend.series} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {latest}
      <dl>
        {result.trends.map((trend) => (
          <div
            key={trend.key}
            className="grid grid-cols-[minmax(0,1fr)_auto_3rem] items-center gap-2 border-t py-1.5"
          >
            <dt className="text-muted-foreground text-sm">{trend.label}</dt>
            <dd className="flex flex-col items-end">
              <span className="font-mono text-sm font-medium tabular-nums">{trend.value}</span>
              <TrendChange trend={trend} shared={shared} />
            </dd>
            <dd>
              <Sparkline series={trend.series} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
