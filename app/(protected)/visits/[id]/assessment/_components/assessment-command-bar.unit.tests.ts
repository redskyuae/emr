import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { getStaticClinicianVisit } from '../../../_data/static-clinician-visits';
import { createAssessmentState } from '../_utils/assessment-state';
import { AssessmentCommandBar } from './assessment-command-bar';

const state = createAssessmentState(getStaticClinicianVisit(15730)!);
const commonProps = {
  state,
  errors: [],
  confirmOpen: false,
  dispatch: () => undefined,
  onNext: () => undefined,
  onPrevious: () => undefined,
  onValidate: () => undefined,
  onConfirmOpenChange: () => undefined,
};

describe('AssessmentCommandBar', () => {
  it('should advance without requiring validation before the final step', () => {
    const html = renderToStaticMarkup(
      createElement(AssessmentCommandBar, {
        ...commonProps,
        currentStep: 0,
        stepCount: 4,
      })
    );

    expect(html).toContain('Step 1 of 4');
    expect(html).toContain('Next: Examination');
    expect(html).not.toContain('Complete Visit');
  });

  it('should offer completion only on the final step', () => {
    const html = renderToStaticMarkup(
      createElement(AssessmentCommandBar, {
        ...commonProps,
        currentStep: 3,
        stepCount: 4,
      })
    );

    expect(html).toContain('Previous');
    expect(html).toContain('Complete Visit');
    expect(html).not.toContain('Next:');
  });
});
