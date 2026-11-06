import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type VisitWorkflowInput = {
  status: VisitStatus;
  vitalsCount: number;
  noteCount: number;
  draftNoteCount: number;
  invoiceCount: number;
};

export type VisitWorkflowStepState = 'done' | 'current' | 'upcoming' | 'skipped' | 'cancelled';

export type VisitWorkflowStepKey =
  'checked-in' | 'vitals' | 'consultation' | 'signed' | 'invoice' | 'completed' | 'cancelled';

export type VisitWorkflowStep = {
  key: VisitWorkflowStepKey;
  label: string;
  state: VisitWorkflowStepState;
};

export function visitWorkflowSteps(input: VisitWorkflowInput): VisitWorkflowStep[] {
  const closed = input.status === 'COMPLETED' || input.status === 'CANCELLED';
  const reached: [VisitWorkflowStepKey, string, boolean][] = [
    ['checked-in', 'Checked in', true],
    ['vitals', 'Vital Signs', input.vitalsCount > 0],
    ['consultation', 'Consultation', input.noteCount > 0],
    ['signed', 'Note signed', input.noteCount > 0 && input.draftNoteCount === 0],
    ['invoice', 'Invoice', input.invoiceCount > 0],
    ['completed', 'Completed', input.status === 'COMPLETED'],
  ];
  const currentKey = closed ? undefined : reached.find(([, , done]) => !done)?.[0];

  const steps = reached
    .filter(([key]) => input.status !== 'CANCELLED' || key !== 'completed')
    .map(([key, label, done]): VisitWorkflowStep => {
      if (done) return { key, label, state: 'done' };
      if (key === currentKey) return { key, label, state: 'current' };
      return { key, label, state: closed ? 'skipped' : 'upcoming' };
    });

  return input.status === 'CANCELLED'
    ? [...steps, { key: 'cancelled', label: 'Cancelled', state: 'cancelled' }]
    : steps;
}

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
