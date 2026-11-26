import { describe, expect, it } from 'vitest';

import {
  visitOutstandingItems,
  visitOutstandingKinds,
  visitUnsavedItems,
  type VisitWorkflowInput,
} from './visit-workflow';

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
    expect(visitOutstandingItems({ ...base, noteCount: 1, draftNoteCount: 1 })).toContain(
      '1 Clinical Note is still a draft.'
    );
  });

  it('should warn first about unsaved consultation changes', () => {
    expect(visitOutstandingItems({ ...base, consultationDirty: true })[0]).toBe(
      'The consultation has unsaved changes.'
    );
  });

  it('should be empty when the Visit is ready to complete', () => {
    expect(
      visitOutstandingItems({ ...base, vitalsCount: 1, noteCount: 1, invoiceCount: 1 })
    ).toEqual([]);
  });
});

describe('visitUnsavedItems', () => {
  it('should list only the unsaved changes, not the other open items', () => {
    expect(visitUnsavedItems({ ...base, diagnosesDirty: true })).toEqual([
      'The coded diagnoses have unsaved changes.',
    ]);
    expect(visitUnsavedItems(base)).toEqual([]);
  });
});

describe('visitOutstandingKinds', () => {
  it('should give one fixed kind per open item, in the order the items are listed', () => {
    const input = { ...base, consultationDirty: true, noteCount: 3, draftNoteCount: 2 };

    expect(visitOutstandingKinds(input)).toEqual([
      'unsaved_consultation',
      'no_vital_signs',
      'draft_clinical_notes',
      'no_invoice',
    ]);
    expect(visitOutstandingKinds(input)).toHaveLength(visitOutstandingItems(input).length);
  });

  it('should warn about coded diagnoses that are not saved, after the consultation', () => {
    const input = {
      ...base,
      vitalsCount: 1,
      noteCount: 1,
      invoiceCount: 1,
      consultationDirty: true,
      diagnosesDirty: true,
    };

    expect(visitOutstandingKinds(input)).toEqual(['unsaved_consultation', 'unsaved_diagnoses']);
    expect(visitOutstandingItems(input)).toEqual([
      'The consultation has unsaved changes.',
      'The coded diagnoses have unsaved changes.',
    ]);
  });

  it('should be empty when nothing is open', () => {
    expect(
      visitOutstandingKinds({ ...base, vitalsCount: 2, noteCount: 1, invoiceCount: 1 })
    ).toEqual([]);
  });

  it('should skip the Patient Chart checks when the chart counts are unknown', () => {
    expect(
      visitOutstandingKinds({ ...base, vitalsCount: null, noteCount: null, draftNoteCount: null })
    ).toEqual(['no_invoice']);
  });
});
