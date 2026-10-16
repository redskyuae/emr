import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { getStaticClinicianVisit } from '../../../_data/static-clinician-visits';
import { ClinicianAssessmentPageImpl } from './clinician-assessment-page-impl';

describe('ClinicianAssessmentPageImpl', () => {
  it('should open on one readable step while keeping every consultation step directly available', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const html = renderToStaticMarkup(createElement(ClinicianAssessmentPageImpl, { visit }));

    expect(html).toContain('Step 1 of 4');
    expect(html).toContain('Intake');
    expect(html).toContain('Examination');
    expect(html).toContain('Diagnosis &amp; Orders');
    expect(html).toContain('Complete Visit');
    expect(html).toContain('Vital Signs');
    expect(html).toContain('focus-visible:ring-2');
    expect(html).not.toContain('Review of Systems');
    expect(html).not.toContain('Desktop workspace required');
    expect(html).not.toContain('min-width:1400px');
    expect(html).not.toContain('data-slot="progress"');
    expect(html).not.toContain('<main');
  });
});
