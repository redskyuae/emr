import { describe, expect, it } from 'vitest';

import {
  visitOutstandingItems,
  visitWorkflowSteps,
  type VisitWorkflowInput,
} from './visit-workflow';

const base: VisitWorkflowInput = {
  status: 'IN_CONSULTATION',
  vitalsCount: 0,
  noteCount: 0,
  draftNoteCount: 0,
  invoiceCount: 0,
};

function states(input: VisitWorkflowInput) {
  return visitWorkflowSteps(input).map((step) => `${step.key}:${step.state}`);
}

describe('visitWorkflowSteps', () => {
  it('should make the first unfinished step current', () => {
    expect(states(base)).toEqual([
      'checked-in:done',
      'vitals:current',
      'consultation:upcoming',
      'signed:upcoming',
      'invoice:upcoming',
      'completed:upcoming',
    ]);
  });

  it('should not treat a draft note as signed', () => {
    expect(states({ ...base, vitalsCount: 1, noteCount: 1, draftNoteCount: 1 })).toEqual([
      'checked-in:done',
      'vitals:done',
      'consultation:done',
      'signed:current',
      'invoice:upcoming',
      'completed:upcoming',
    ]);
  });

  it('should keep vitals current when a note was written before them', () => {
    expect(states({ ...base, noteCount: 1 })).toContain('vitals:current');
    expect(states({ ...base, noteCount: 1 })).toContain('signed:done');
  });

  it('should move on to the Invoice once the note is signed', () => {
    expect(states({ ...base, vitalsCount: 1, noteCount: 1 })).toContain('invoice:current');
  });

  it('should show what a completed Visit skipped', () => {
    expect(states({ ...base, status: 'COMPLETED', noteCount: 1 })).toEqual([
      'checked-in:done',
      'vitals:skipped',
      'consultation:done',
      'signed:done',
      'invoice:skipped',
      'completed:done',
    ]);
  });

  it('should end a cancelled Visit on the cancelled step', () => {
    expect(states({ ...base, status: 'CANCELLED' })).toEqual([
      'checked-in:done',
      'vitals:skipped',
      'consultation:skipped',
      'signed:skipped',
      'invoice:skipped',
      'cancelled:cancelled',
    ]);
  });
});

describe('visitOutstandingItems', () => {
  it('should list everything still open on a new Visit', () => {
    expect(visitOutstandingItems(base)).toEqual([
      'No Vital Signs recorded.',
      'No Clinical Note recorded.',
      'No Invoice linked to this Visit.',
    ]);
  });

  it('should count unsigned Clinical Notes', () => {
    expect(visitOutstandingItems({ ...base, noteCount: 2, draftNoteCount: 2 })).toContain(
      '2 Clinical Notes are still drafts.'
    );
  });

  it('should be empty when the Visit is ready to complete', () => {
    expect(
      visitOutstandingItems({ ...base, vitalsCount: 1, noteCount: 1, invoiceCount: 1 })
    ).toEqual([]);
  });
});
