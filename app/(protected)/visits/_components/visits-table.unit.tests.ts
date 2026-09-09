import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { toVisitBoardRows } from '../_data/static-clinician-visits';
import { VisitsTable } from './visits-table';

describe('VisitsTable', () => {
  it('should render both static Visits with consultation links', () => {
    const html = renderToStaticMarkup(createElement(VisitsTable, { visits: toVisitBoardRows() }));

    expect(html).toContain('VST-15730');
    expect(html).toContain('VST-15731');
    expect(html).toContain('/visits/15730/assessment');
    expect(html).toContain('/visits/15731/assessment');
    expect(html.match(/Open consultation/g)).toHaveLength(2);
  });
});
