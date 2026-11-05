import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { createEditor } from 'lexical';
import { describe, expect, it } from 'vitest';

import { CLINICAL_MARKDOWN_TRANSFORMERS } from './markdown-transformers';

function roundTrip(value: string) {
  const editor = createEditor({
    nodes: [HeadingNode, ListNode, ListItemNode],
    onError: (error) => {
      throw error;
    },
  });
  editor.update(
    () => $convertFromMarkdownString(value, CLINICAL_MARKDOWN_TRANSFORMERS, undefined, true),
    { discrete: true }
  );
  return editor
    .getEditorState()
    .read(() => $convertToMarkdownString(CLINICAL_MARKDOWN_TRANSFORMERS, undefined, true))
    .trim();
}

describe('clinical Lexical Markdown', () => {
  it('restores legacy plain text', () => {
    expect(roundTrip('Pain for three days\nNo fever')).toBe('Pain for three days\nNo fever');
  });

  it('retains headings, emphasis, and lists across a save and reopen', () => {
    const content = '## Assessment\n\n**Pain** improved\n\n- Rest\n- Hydrate';
    expect(roundTrip(content)).toBe(content);
  });
});
