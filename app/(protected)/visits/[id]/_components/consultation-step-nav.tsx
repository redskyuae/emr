import {
  BadgeCheck,
  Check,
  ClipboardPlus,
  Leaf,
  MessageSquareText,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ConsultationStep, ConsultationStepId } from '../_utils/consultation-steps';

type StepTone = {
  icon: LucideIcon;
  /** Icon and accent text. */
  text: string;
  /** Filled badge with readable foreground. */
  solid: string;
  /** Tinted surface behind the current step and the step heading icon. */
  soft: string;
  /** Underline under the current step. */
  bar: string;
};

/**
 * Each step keeps one colour so the Doctor can tell where they are at a glance.
 * Plan & Session uses the Treatment colour and Review uses the completion colour.
 */
export const STEP_TONE: Record<ConsultationStepId, StepTone> = {
  subjective: {
    icon: MessageSquareText,
    text: 'text-primary',
    solid: 'bg-primary text-primary-foreground',
    soft: 'bg-primary/10',
    bar: 'shadow-[inset_0_-3px_0_var(--primary)]',
  },
  objective: {
    icon: Stethoscope,
    text: 'text-chart-4',
    solid: 'bg-chart-4 text-primary-foreground',
    soft: 'bg-chart-4/12',
    bar: 'shadow-[inset_0_-3px_0_var(--chart-4)]',
  },
  assessment: {
    icon: ClipboardPlus,
    text: 'text-pop',
    solid: 'bg-pop text-pop-foreground',
    soft: 'bg-pop/10',
    bar: 'shadow-[inset_0_-3px_0_var(--pop)]',
  },
  plan: {
    icon: Leaf,
    text: 'text-procedure',
    solid: 'bg-procedure text-primary-foreground',
    soft: 'bg-procedure/10',
    bar: 'shadow-[inset_0_-3px_0_var(--procedure)]',
  },
  review: {
    icon: BadgeCheck,
    text: 'text-success',
    solid: 'bg-success text-primary-foreground',
    soft: 'bg-success/10',
    bar: 'shadow-[inset_0_-3px_0_var(--success)]',
  },
};

export function ConsultationStepNav({
  steps,
  current,
  filled,
  onSelect,
}: {
  steps: ConsultationStep[];
  current: ConsultationStepId;
  filled?: (step: ConsultationStep) => number;
  onSelect: (id: ConsultationStepId) => void;
}) {
  return (
    <nav aria-label="Consultation steps" className="border-b">
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-1 p-1.5">
        {steps.map((step) => {
          const isCurrent = step.id === current;
          const count = filled?.(step) ?? 0;
          const done = !isCurrent && count > 0;
          const tone = STEP_TONE[step.id];
          const Icon = done ? Check : tone.icon;

          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelect(step.id)}
                className={cn(
                  'focus-visible:ring-ring/50 flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm outline-none focus-visible:ring-3',
                  isCurrent ? cn(tone.soft, tone.bar) : 'hover:bg-accent/60'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full',
                    isCurrent || done ? tone.solid : cn(tone.soft, tone.text)
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className={cn('block font-semibold', isCurrent && 'font-bold')}>
                    {step.title}
                  </span>
                  {filled && step.fields.length ? (
                    <span className="text-muted-foreground block text-xs tabular-nums">
                      {count}/{step.fields.length} filled
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
