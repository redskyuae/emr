import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ConsultationStep, ConsultationStepId } from '../_utils/consultation-steps';
import { ConsultationStepNav, STEP_TONE } from './consultation-step-nav';

/** The read-only Visit's layout: the steps beside the recorded note. */
export const STEP_LAYOUT =
  'flex flex-col gap-3 2xl:grid 2xl:h-full 2xl:min-h-0 2xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-rows-[minmax(0,1fr)]';

function StepHeading({ step }: { step: ConsultationStep }) {
  const tone = STEP_TONE[step.id];
  const Icon = tone.icon;

  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn('grid size-10 shrink-0 place-items-center rounded-lg', tone.soft, tone.text)}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <h2 id={`consult-step-${step.id}`} tabIndex={-1} className="text-xl font-bold outline-none">
          {step.title}
        </h2>
        <p className="text-muted-foreground text-sm">{step.description}</p>
      </div>
    </div>
  );
}

/**
 * One step of the Visit at a time, with Back and Continue. Every step stays mounted and
 * hidden steps keep their state, so nothing typed is lost when the Doctor moves on.
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
      <section className="bg-card shadow-fluent-8 flex flex-col rounded-lg border xl:min-h-0 xl:flex-1">
        <div
          aria-hidden="true"
          className={cn('h-1 flex-none rounded-t-lg', STEP_TONE[steps[index].id].solid)}
        />
        <ConsultationStepNav
          steps={steps}
          current={steps[index].id}
          filled={filled}
          onSelect={onSelect}
        />

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
              <StepHeading step={step} />
              {renderStep(step.id)}
            </div>
          ))}
        </div>

        <div className="bg-card sticky bottom-0 z-[5] flex flex-wrap items-center gap-2 rounded-b-lg border-t p-3 xl:static">
          {previous ? (
            <Button
              type="button"
              variant="outline"
              aria-label={`Back to ${previous.title}`}
              onClick={() => onSelect(previous.id)}
            >
              <ArrowLeft className="size-4" />
              {previous.title}
            </Button>
          ) : null}
          <div className="min-w-0 flex-1 text-center">
            {status}
            <p className="text-muted-foreground text-xs tabular-nums">
              Step {index + 1} of {steps.length}
            </p>
          </div>
          {actions}
          {next ? (
            <Button type="button" onClick={() => onSelect(next.id)}>
              Continue to {next.title}
              <ArrowRight className="size-4" />
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
