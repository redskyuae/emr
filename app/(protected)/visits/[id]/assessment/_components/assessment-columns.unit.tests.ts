import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getStaticClinicianVisit } from '../../../_data/static-clinician-visits';
import { createAssessmentState } from '../_utils/assessment-state';
import { AssessColumn } from './assess-column';
import { ExamineColumn } from './examine-column';
import { PlanColumn } from './plan-column';

const visit = getStaticClinicianVisit(15730)!;
const state = createAssessmentState(visit);
const dispatch = () => undefined;

describe('assessment workflow columns', () => {
  it('renders the complete Assess workflow', () => {
    const markup = renderToStaticMarkup(React.createElement(AssessColumn, { state, dispatch }));

    expect(markup).toContain('Vital Signs');
    expect(markup).toContain('History of Present Illness');
    expect(markup).toContain('Allergies &amp; Problems');
    expect(markup).toContain('Smoking');
    expect(markup).toContain('Physical activity');
    expect(markup).toContain('Family history');
    expect(markup).toContain('Social history');
  });

  it('renders the complete Examine workflow and abnormal remarks', () => {
    const markup = renderToStaticMarkup(React.createElement(ExamineColumn, { state, dispatch }));

    expect(markup).toContain('Review of Systems');
    expect(markup).toContain('Physical Examination');
    expect(markup).toContain('Mark all normal');
    expect(markup).toContain('Dry cough; no shortness of breath.');
    expect(markup).toContain('Prakriti');
    expect(markup).toContain('Vikriti');
    expect(markup).toContain('Ashtavidha');
  });

  it('allows each workflow column to scroll on short browser viewports', () => {
    const columns = [AssessColumn, ExamineColumn, PlanColumn];

    for (const Column of columns) {
      const markup = renderToStaticMarkup(React.createElement(Column, { state, dispatch }));

      expect(markup).toContain('[@media(max-height:900px)]:overflow-y-auto');
      expect(markup).toContain('[@media(max-height:900px)]:auto-rows-max');
    }
  });
});
