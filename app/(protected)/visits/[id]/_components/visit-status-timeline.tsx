'use client';

import { Check, X } from 'lucide-react';

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
      at: formatMoment(visit.checkedInAt),
      reached: true,
    },
    {
      key: 'in-consultation',
      label: 'In consultation',
      at: formatMoment(visit.consultationStartedAt),
      reached: visit.consultationStartedAt !== null,
    },
    {
      key: 'completed',
      label: 'Completed',
      at: formatMoment(visit.completedAt),
      reached: visit.completedAt !== null,
    },
  ];

  if (visit.status === 'CANCELLED') {
    steps.push({
      key: 'cancelled',
      label: 'Cancelled',
      at: formatMoment(visit.cancelledAt),
      reached: true,
    });
  }

  return (
    <ol
      className="grid gap-3 sm:auto-cols-fr sm:grid-flow-col sm:gap-0"
      aria-label="Visit progress"
    >
      {steps.map((step) => {
        return (
          <li
            key={step.key}
            className="sm:after:bg-border relative flex items-start gap-2.5 sm:pr-3 sm:after:absolute sm:after:top-3 sm:after:right-1 sm:after:left-9 sm:after:h-px sm:last:after:hidden"
          >
            <span
              className={cn(
                'bg-background relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2',
                step.reached
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground',
                step.key === 'cancelled' &&
                  'border-destructive bg-destructive text-destructive-foreground'
              )}
            >
              {step.reached ? (
                step.key === 'cancelled' ? (
                  <X className="size-3.5" />
                ) : (
                  <Check className="size-3.5" />
                )
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>
            <div className="text-sm sm:-ml-8 sm:pt-7">
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
