import { TriangleAlert } from 'lucide-react';

import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { vitalTrends } from '../_utils/vital-trends';

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
    <svg width="48" height="18" viewBox="0 0 48 18" className="text-chart-4" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function moment(value: Date) {
  return value.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VisitVitalTrends({
  readings,
  loading,
  error,
  emptyText,
}: {
  readings: PatientVitalSign[];
  loading: boolean;
  error: boolean;
  emptyText: string;
}) {
  if (loading) return <Skeleton className="h-40 w-full" aria-label="Loading Vital Signs" />;
  if (error) return <p className="text-destructive text-sm">Vital Signs could not be loaded.</p>;

  const result = vitalTrends(readings);

  if (!result || result.trends.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">
        Latest <span className="font-mono tabular-nums">{moment(result.recordedAt)}</span>
        {result.previousAt ? (
          <>
            {' '}
            · vs <span className="font-mono tabular-nums">{moment(result.previousAt)}</span>
          </>
        ) : null}
      </p>
      <dl>
        {result.trends.map((trend) => (
          <div
            key={trend.key}
            className="grid grid-cols-[minmax(0,1fr)_auto_3rem] items-center gap-2 border-t py-1.5"
          >
            <dt className="text-muted-foreground text-sm">{trend.label}</dt>
            <dd className="flex flex-col items-end">
              <span className="font-mono text-sm font-medium tabular-nums">{trend.value}</span>
              {trend.change !== null || trend.attention ? (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs tabular-nums',
                    trend.attention ? 'text-warning font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {trend.attention ? (
                    <TriangleAlert className="size-3" aria-label="Outside the usual adult range" />
                  ) : null}
                  {trend.change ?? 'First reading'}
                </span>
              ) : null}
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
