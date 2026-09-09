import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getStaticClinicianVisit } from '../../../_data/static-clinician-visits';
import { createAssessmentState } from '../_utils/assessment-state';
import { PlanColumn } from './plan-column';

describe('PlanColumn', () => {
  it('renders each planning and completion workflow group', () => {
    const state = createAssessmentState(getStaticClinicianVisit(15730)!);
    const markup = renderToStaticMarkup(
      React.createElement(PlanColumn, { state, dispatch: () => undefined })
    );

    expect(markup).toContain('Clinical Impression');
    expect(markup).toContain('Diagnosis');
    expect(markup).toContain('Advised Treatment');
    expect(markup).toContain('Treatment Plan');
    expect(markup).toContain('OP Procedure');
    expect(markup).toContain('Prescription');
    expect(markup).toContain('Medical Decision Making');
    expect(markup).toContain('Addendum');
    expect(markup).toContain('Patient Education');
    expect(markup).toContain('Discharge Disposition');
  });
});
