'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor,
} from 'lexical';
import {
  ListItemNode,
  ListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { $setBlocksType } from '@lexical/selection';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $createHeadingNode, $isHeadingNode, HeadingNode } from '@lexical/rich-text';
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Undo2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CLINICAL_MARKDOWN_TRANSFORMERS } from './markdown-transformers';

type RichTextEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  className?: string;
  'aria-label'?: string;
};

function ValuePlugin({ value, onChange }: Pick<RichTextEditorProps, 'value' | 'onChange'>) {
  const [editor] = useLexicalComposerContext();
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.update(
      () => $convertFromMarkdownString(value, CLINICAL_MARKDOWN_TRANSFORMERS, undefined, true),
      {
        tag: 'external-value',
      }
    );
  }, [editor, value]);

  return (
    <OnChangePlugin
      onChange={(editorState, _editor, tags) => {
        if (tags.has('external-value')) return;
        const markdown = editorState
          .read(() => {
            if (!$getRoot().getTextContent().trim()) return '';
            return $convertToMarkdownString(CLINICAL_MARKDOWN_TRANSFORMERS, undefined, true);
          })
          .trim();
        if (markdown === lastEmitted.current) return;
        lastEmitted.current = markdown;
        onChange(markdown);
      }}
    />
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant={pressed ? 'secondary' : 'ghost'}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function toggleHeading(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    const node = selection.anchor.getNode().getTopLevelElementOrThrow();
    const isHeading = $isHeadingNode(node) && node.getTag() === 'h2';
    $setBlocksType(selection, () =>
      isHeading ? $createParagraphNode() : $createHeadingNode('h2')
    );
  });
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    strike: false,
    heading: false,
  });

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const node = selection.anchor.getNode().getTopLevelElement();
          setActive({
            bold: selection.hasFormat('bold'),
            italic: selection.hasFormat('italic'),
            strike: selection.hasFormat('strikethrough'),
            heading: $isHeadingNode(node) && node.getTag() === 'h2',
          });
        });
      }),
    [editor]
  );

  return (
    <div
      className="bg-muted/40 flex flex-wrap gap-0.5 border-b p-1"
      role="toolbar"
      aria-label="Text formatting"
    >
      <ToolbarButton
        label="Bold"
        pressed={active.bold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        pressed={active.italic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        pressed={active.strike}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <span className="bg-border mx-1 w-px" aria-hidden="true" />
      <ToolbarButton label="Heading" pressed={active.heading} onClick={() => toggleHeading(editor)}>
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bulleted list"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <span className="bg-border mx-1 w-px" aria-hidden="true" />
      <ToolbarButton label="Undo" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

function EditableStatePlugin({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => editor.setEditable(!disabled), [disabled, editor]);
  return null;
}

export function RichTextEditor({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  required,
  invalid,
  className,
  'aria-label': ariaLabel,
}: RichTextEditorProps) {
  const namespace = useId();
  const initialConfig = useMemo(
    () => ({
      namespace: `clinical-rich-text-${namespace}`,
      editable: !disabled,
      nodes: [HeadingNode, ListNode, ListItemNode],
      onError: (error: Error) => {
        throw error;
      },
      editorState: () =>
        $convertFromMarkdownString(value, CLINICAL_MARKDOWN_TRANSFORMERS, undefined, true),
      theme: {
        heading: { h2: 'text-base font-semibold' },
        list: { ul: 'list-disc pl-5', ol: 'list-decimal pl-5' },
        text: { bold: 'font-semibold', italic: 'italic', strikethrough: 'line-through' },
      },
    }),
    // LexicalComposer reads this configuration only on mount. ValuePlugin handles later updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespace]
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={cn(
          'border-input bg-background focus-within:border-ring focus-within:ring-ring/50 rounded-md border text-sm focus-within:ring-[3px]',
          invalid && 'border-destructive',
          disabled && 'bg-muted/50 opacity-70',
          className
        )}
      >
        {!disabled ? <Toolbar /> : null}
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                id={id}
                aria-label={ariaLabel}
                aria-required={required}
                aria-invalid={invalid}
                onBlur={onBlur}
                className="min-h-24 w-full px-3 py-2 outline-none [&_p]:min-h-5"
              />
            }
            placeholder={
              placeholder ? (
                <span className="text-muted-foreground pointer-events-none absolute top-2 left-3">
                  {placeholder}
                </span>
              ) : null
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <ValuePlugin value={value} onChange={onChange} />
          <EditableStatePlugin disabled={disabled} />
        </div>
      </div>
    </LexicalComposer>
  );
}
