import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DesktopWorkspaceGuard } from './desktop-workspace-guard';

describe('DesktopWorkspaceGuard', () => {
  it('keeps the workflow available on short desktop viewports', () => {
    const html = renderToStaticMarkup(
      createElement(DesktopWorkspaceGuard, null, createElement('p', null, 'Visit workflow'))
    );

    expect(html).toContain('min-width:1400px');
    expect(html).not.toContain('min-height:820px');
    expect(html).toContain('Visit workflow');
  });
});
