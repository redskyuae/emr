import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RichTextContent } from './rich-text-content';

describe('RichTextContent', () => {
  it('renders saved clinical formatting without interpreting raw HTML', () => {
    const html = renderToStaticMarkup(
      createElement(RichTextContent, {
        value:
          '## Plan\n\n**Rest** and ~~avoid~~ lifting\n\n- Review in 7 days\n\n<script>alert(1)</script>\n\n![external image](https://example.com/image.png)',
      })
    );

    expect(html).toContain('<h2>Plan</h2>');
    expect(html).toContain('<strong>Rest</strong>');
    expect(html).toContain('<del>avoid</del>');
    expect(html).toContain('<li>Review in 7 days</li>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
  });
});
