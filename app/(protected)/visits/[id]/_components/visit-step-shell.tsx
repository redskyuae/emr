import type { ReactNode } from 'react';
import { PiArrowLeftLight, PiArrowRightLight } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import type { ConsultationStep, ConsultationStepId } from '../_utils/consultation-steps';
import { ConsultationStepNav, STEP_TONE } from './consultation-step-nav';

/**
 * The read-only Visit's layout: the step track across the top, then the steps beside the
 * recorded note.
 */
export const STEP_LAYOUT =
  'flex flex-col gap-3 2xl:grid 2xl:h-full 2xl:min-h-0 2xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-rows-[auto_minmax(0,1fr)]';

function StepHeading({ step, filled }: { step: ConsultationStep; filled?: number }) {
  const tone = STEP_TONE[step.id];
  const Icon = tone.icon;
  const total = step.fields.length;

  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn('grid size-10 shrink-0 place-items-center rounded-lg', tone.soft, tone.text)}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id={`consult-step-${step.id}`} tabIndex={-1} className="text-xl font-bold outline-none">
          {step.title}
        </h2>
        <p className="text-muted-foreground text-sm">{step.description}</p>
      </div>
      {filled !== undefined && total ? (
        <div className="flex flex-none flex-col items-end gap-1.5 pt-1">
          <p className="text-muted-foreground text-xs tabular-nums">
            <span className="text-foreground font-semibold">{filled}</span> of {total} filled
          </p>
          <Progress
            value={(filled / total) * 100}
            aria-label={`${step.title} fields filled`}
            className={cn('w-28', tone.progress)}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * One step of the Visit at a time, with Back and Continue. The step track sits on the page
 * above the step card. Every step stays mounted and hidden steps keep their state, so nothing
 * typed is lost when the Doctor moves on.
 */
export function VisitStepShell({
  steps,
  current,
  onSelect,
  filled,
  renderStep,
  alert,
  status,
  actions,
  finalAction,
  aside,
}: {
  steps: ConsultationStep[];
  current: ConsultationStepId;
  onSelect: (id: ConsultationStepId) => void;
  filled?: (step: ConsultationStep) => number;
  renderStep: (id: ConsultationStepId) => ReactNode;
  alert?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  finalAction?: ReactNode;
  aside?: ReactNode;
}) {
  const index = Math.max(
    steps.findIndex((step) => step.id === current),
    0
  );
  const previous = steps[index - 1];
  const next = steps[index + 1];

  return (
    <>
      <ConsultationStepNav
        steps={steps}
        current={steps[index].id}
        filled={filled}
        onSelect={onSelect}
      />

      <section className="bg-card flex flex-col rounded-xl border xl:min-h-0 xl:flex-1">
        <div id="consult-step-body" className="flex-1 space-y-4 p-5 xl:min-h-0 xl:overflow-y-auto">
          {alert}
          {steps.map((step, position) => (
            <div
              key={step.id}
              hidden={position !== index}
              role="group"
              aria-labelledby={`consult-step-${step.id}`}
              className="space-y-4"
            >
              <StepHeading step={step} filled={filled?.(step)} />
              {renderStep(step.id)}
            </div>
          ))}
        </div>

        <div className="bg-card sticky bottom-0 z-[5] flex flex-wrap items-center gap-2 rounded-b-xl border-t p-3 xl:static">
          <div className="min-w-0 flex-1 px-1">
            {status}
            <p className="text-muted-foreground text-xs tabular-nums">
              Step {index + 1} of {steps.length}
            </p>
          </div>
          {previous ? (
            <Button
              type="button"
              variant="ghost"
              aria-label={`Back to ${previous.title}`}
              onClick={() => onSelect(previous.id)}
            >
              <PiArrowLeftLight className="size-4" />
              {/* A phone keeps the arrow only, so the save status stays on one line. */}
              <span className="max-sm:hidden">Back</span>
            </Button>
          ) : null}
          {actions}
          {next ? (
            <Button type="button" onClick={() => onSelect(next.id)}>
              Continue to {next.title}
              <PiArrowRightLight className="size-4" />
            </Button>
          ) : (
            finalAction
          )}
        </div>
      </section>

      {aside}
    </>
  );
}
