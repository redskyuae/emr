import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type VisitWorkflowInput = {
  status: VisitStatus;
  vitalsCount: number;
  noteCount: number;
  draftNoteCount: number;
  invoiceCount: number;
  /** The consultation form has changes that are not saved yet. */
  consultationDirty?: boolean;
};

/**
 * The fixed kinds of open item, in the order the complete dialog lists them. Analytics sends
 * these, never the display sentences.
 */
export const VISIT_OUTSTANDING_KINDS = [
  'unsaved_consultation',
  'no_vital_signs',
  'no_clinical_note',
  'draft_clinical_notes',
  'no_invoice',
] as const;

type VisitOutstandingKind = (typeof VISIT_OUTSTANDING_KINDS)[number];

/** The kinds of what is still open on the Visit. */
export function visitOutstandingKinds(input: VisitWorkflowInput): VisitOutstandingKind[] {
  const kinds: VisitOutstandingKind[] = [];

  if (input.consultationDirty) kinds.push('unsaved_consultation');
  if (input.vitalsCount === 0) kinds.push('no_vital_signs');
  if (input.noteCount === 0) kinds.push('no_clinical_note');
  if (input.draftNoteCount > 0) kinds.push('draft_clinical_notes');
  if (input.invoiceCount === 0) kinds.push('no_invoice');

  return kinds;
}

function outstandingItemText(kind: VisitOutstandingKind, input: VisitWorkflowInput) {
  switch (kind) {
    case 'unsaved_consultation':
      return 'The consultation has unsaved changes.';
    case 'no_vital_signs':
      return 'No Vital Signs recorded.';
    case 'no_clinical_note':
      return 'No Clinical Note recorded.';
    case 'draft_clinical_notes':
      return input.draftNoteCount === 1
        ? '1 Clinical Note is still a draft.'
        : `${input.draftNoteCount} Clinical Notes are still drafts.`;
    case 'no_invoice':
      return 'No Invoice linked to this Visit.';
  }
}

/** What is still open on the Visit. Completion warns about these; it does not block. */
export function visitOutstandingItems(input: VisitWorkflowInput): string[] {
  return visitOutstandingKinds(input).map((kind) => outstandingItemText(kind, input));
}
