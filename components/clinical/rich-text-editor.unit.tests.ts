// @vitest-environment jsdom

import { createElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RichTextEditor } from './rich-text-editor';

describe('RichTextEditor', () => {
  it('restores saved formatting and responds to external form resets', async () => {
    const onChange = vi.fn();
    const view = render(
      createElement(RichTextEditor, {
        id: 'clinical-note',
        value: '**Pain** improved',
        onChange,
      })
    );

    await waitFor(() => expect(screen.getByText('Pain').tagName).toBe('STRONG'));

    view.rerender(
      createElement(RichTextEditor, {
        id: 'clinical-note',
        value: '## Follow-up',
        onChange,
      })
    );

    await waitFor(() => expect(screen.getByText('Follow-up').closest('h2')).not.toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });
});
