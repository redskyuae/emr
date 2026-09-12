import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getStaticClinicianVisit } from '../../../_data/static-clinician-visits';
import { createAssessmentState } from '../_utils/assessment-state';
import { PlanColumn } from './plan-column';

describe('PlanColumn', () => {
  it('should show diagnosis and orders without completion fields in the planning step', () => {
    const state = createAssessmentState(getStaticClinicianVisit(15730)!);
    const markup = renderToStaticMarkup(
      React.createElement(PlanColumn, {
        state,
        view: 'orders',
        dispatch: () => undefined,
      })
    );

    expect(markup).toContain('Clinical Impression');
    expect(markup).toContain('Diagnosis');
    expect(markup).toContain('Advised Treatment');
    expect(markup).toContain('Treatment Plan');
    expect(markup).toContain('OP Procedure');
    expect(markup).toContain('Prescription');
    expect(markup).toContain(
      'aria-label="Remove Mild intermittent asthma with acute exacerbation"'
    );
    expect(markup).not.toContain('Medical Decision Making');
    expect(markup).not.toContain('Visit Completion');
  });

  it('should show review and discharge fields without repeating the planning step', () => {
    const state = createAssessmentState(getStaticClinicianVisit(15730)!);
    const markup = renderToStaticMarkup(
      React.createElement(PlanColumn, {
        state,
        view: 'completion',
        dispatch: () => undefined,
      })
    );

    expect(markup).toContain('Medical Decision Making');
    expect(markup).toContain('Addendum');
    expect(markup).toContain('Patient Education');
    expect(markup).toContain('Discharge Disposition');
    expect(markup).not.toContain('Clinical Impression');
    expect(markup).not.toContain('Prescription');
  });
});
