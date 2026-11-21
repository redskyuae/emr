import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type VisitWorkflowInput = {
  status: VisitStatus;
  vitalsCount: number;
  noteCount: number;
  draftNoteCount: number;
  invoiceCount: number;
};

/** What is still open on the Visit. Completion warns about these; it does not block. */
export function visitOutstandingItems(input: VisitWorkflowInput): string[] {
  const items: string[] = [];

  if (input.vitalsCount === 0) items.push('No Vital Signs recorded.');
  if (input.noteCount === 0) items.push('No Clinical Note recorded.');
  if (input.draftNoteCount > 0) {
    items.push(
      input.draftNoteCount === 1
        ? '1 Clinical Note is still a draft.'
        : `${input.draftNoteCount} Clinical Notes are still drafts.`
    );
  }
  if (input.invoiceCount === 0) items.push('No Invoice linked to this Visit.');

  return items;
}
