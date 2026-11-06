'use client';

import { Check, Circle, Minus, X } from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { cn } from '@/lib/utils';

import type {
  VisitWorkflowStep,
  VisitWorkflowStepKey,
  VisitWorkflowStepState,
} from '../_utils/visit-workflow';

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

const STATE_LABEL: Record<VisitWorkflowStepState, string> = {
  done: 'Done',
  current: 'Next',
  upcoming: 'Pending',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
};

function StepIcon({ state }: { state: VisitWorkflowStepState }) {
  if (state === 'done') return <Check className="size-3.5" />;
  if (state === 'cancelled') return <X className="size-3.5" />;
  if (state === 'skipped') return <Minus className="size-3.5" />;
  return <Circle className="size-2 fill-current" />;
}

export function VisitWorkflowStepper({
  visit,
  steps,
  onStepSelect,
}: {
  visit: Visit;
  steps: VisitWorkflowStep[];
  onStepSelect: (key: VisitWorkflowStepKey) => void;
}) {
  const moments: Partial<Record<VisitWorkflowStepKey, string | null>> = {
    'checked-in': formatMoment(visit.checkedInAt),
    consultation: formatMoment(visit.consultationStartedAt),
    completed: formatMoment(visit.completedAt),
    cancelled: formatMoment(visit.cancelledAt),
  };

  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Visit progress">
      {steps.map((step) => (
        <li key={step.key} className="min-w-32 flex-1">
          <button
            type="button"
            aria-current={step.state === 'current' ? 'step' : undefined}
            onClick={() => onStepSelect(step.key)}
            className="hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-md p-1 text-left outline-none focus-visible:ring-3"
          >
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full border-2',
                step.state === 'done' && 'border-primary bg-primary text-primary-foreground',
                step.state === 'current' && 'border-primary text-primary',
                step.state === 'upcoming' && 'border-border text-muted-foreground',
                step.state === 'skipped' && 'border-border bg-muted text-muted-foreground',
                step.state === 'cancelled' &&
                  'border-destructive bg-destructive text-destructive-foreground'
              )}
              aria-hidden="true"
            >
              <StepIcon state={step.state} />
            </span>
            <div className="min-w-0 text-sm">
              <p
                className={cn('font-medium', step.state === 'upcoming' && 'text-muted-foreground')}
              >
                {step.label}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {moments[step.key] ?? STATE_LABEL[step.state]}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ol>
  );
}
