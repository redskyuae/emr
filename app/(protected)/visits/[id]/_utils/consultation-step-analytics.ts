import type { ConsultationStepId } from './consultation-steps';

type ConsultationStepView = { step: ConsultationStepId; shownAt: number };

/** The step shown before this one and the whole seconds it stayed on screen. */
export function consultationStepTransition(
  previous: ConsultationStepView | null,
  now: number
): { previousStep: ConsultationStepId | null; secondsOnPreviousStep: number | null } {
  if (!previous) return { previousStep: null, secondsOnPreviousStep: null };

  return {
    previousStep: previous.step,
    secondsOnPreviousStep: Math.max(0, Math.round((now - previous.shownAt) / 1000)),
  };
}
