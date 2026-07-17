'use client';

import { CheckCircle2, CircleDot, LogIn, XCircle } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { cn } from '@/lib/utils';

function formatMoment(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

export function VisitStatusTimeline({ visit }: { visit: Visit }) {
  const steps = [
    {
      key: 'checked-in',
      label: 'Checked in',
      icon: LogIn,
      at: formatMoment(visit.checkedInAt),
      reached: true,
    },
    {
      key: 'in-consultation',
      label: 'In consultation',
      icon: CircleDot,
      at: formatMoment(visit.consultationStartedAt),
      reached: visit.consultationStartedAt !== null,
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: CheckCircle2,
      at: formatMoment(visit.completedAt),
      reached: visit.completedAt !== null,
    },
  ];

  if (visit.status === 'CANCELLED') {
    steps.push({
      key: 'cancelled',
      label: 'Cancelled',
      icon: XCircle,
      at: formatMoment(visit.cancelledAt),
      reached: true,
    });
  }

  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      {steps.map((step) => {
        const Icon = step.icon;

        return (
          <li key={step.key} className="flex items-center gap-2">
            <Icon
              className={cn(
                'size-4',
                step.reached ? 'text-primary' : 'text-muted-foreground/50',
                step.key === 'cancelled' && 'text-destructive'
              )}
            />
            <div className="text-sm">
              <p className={cn('font-medium', !step.reached && 'text-muted-foreground/70')}>
                {step.label}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">{step.at ?? '—'}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
