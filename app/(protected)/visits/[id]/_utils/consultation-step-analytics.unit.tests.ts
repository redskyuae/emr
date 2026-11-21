import { describe, expect, it } from 'vitest';

import { consultationStepTransition } from './consultation-step-analytics';

describe('consultationStepTransition', () => {
  it('should have no previous step for the first step shown', () => {
    expect(consultationStepTransition(null, 1_000)).toEqual({
      previousStep: null,
      secondsOnPreviousStep: null,
    });
  });

  it('should give the previous step and the whole seconds spent on it', () => {
    expect(consultationStepTransition({ step: 'subjective', shownAt: 10_000 }, 95_600)).toEqual({
      previousStep: 'subjective',
      secondsOnPreviousStep: 86,
    });
  });

  it('should never report a negative time when the clock moves back', () => {
    expect(
      consultationStepTransition({ step: 'objective', shownAt: 5_000 }, 4_000).secondsOnPreviousStep
    ).toBe(0);
  });
});
