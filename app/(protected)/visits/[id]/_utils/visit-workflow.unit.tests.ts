import { describe, expect, it } from 'vitest';

import { visitOutstandingItems, type VisitWorkflowInput } from './visit-workflow';

const base: VisitWorkflowInput = {
  status: 'IN_CONSULTATION',
  vitalsCount: 0,
  noteCount: 0,
  draftNoteCount: 0,
  invoiceCount: 0,
};

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
