import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { getStaticClinicianVisit } from '../../../_data/static-clinician-visits';
import { VisitSafetyStrip } from './visit-safety-strip';

describe('VisitSafetyStrip', () => {
  it('should keep Visit and Patient safety context visible', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const html = renderToStaticMarkup(createElement(VisitSafetyStrip, { visit }));

    expect(html).toContain('Asha Menon');
    expect(html).toContain('MRN-20481');
    expect(html).toContain('VST-15730');
    expect(html).toContain('Northgate General');
    expect(html).toContain('Dr. Maya Iyer');
    expect(html).toContain('In Consultation');
    expect(html).toContain('Penicillin');
    expect(html).toContain('sticky');
    expect(html).toContain('<h2');
    expect(html).not.toContain('<h1');
  });

  it('should show the live completed status after local completion', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const html = renderToStaticMarkup(
      createElement(VisitSafetyStrip, { visit, status: 'COMPLETED' })
    );

    expect(html).toContain('Completed');
    expect(html).not.toContain('In Consultation');
  });

  it('should show manually edited allergies in the safety alert', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const html = renderToStaticMarkup(
      createElement(VisitSafetyStrip, { allergies: ['Latex — rash'], visit })
    );

    expect(html).toContain('Latex — rash');
    expect(html).not.toContain('Penicillin');
  });
});
