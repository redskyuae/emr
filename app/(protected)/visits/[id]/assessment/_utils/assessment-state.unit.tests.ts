import { describe, expect, it } from 'vitest';

import {
  getStaticClinicianVisit,
  staticClinicianVisits,
  toVisitBoardRows,
} from '../../../_data/static-clinician-visits';
import { assessmentReducer, canCompleteAssessment, createAssessmentState } from './assessment-state';

describe('static clinician Visits', () => {
  it('should expose exactly one active and one completed Visit', () => {
    expect(staticClinicianVisits).toHaveLength(2);
    expect(staticClinicianVisits.map((visit) => visit.status)).toEqual([
      'IN_CONSULTATION',
      'COMPLETED',
    ]);
  });

  it('should resolve only finite integer Visit identifiers', () => {
    expect(getStaticClinicianVisit(15730)?.visitNumber).toBe('VST-15730');
    expect(getStaticClinicianVisit(99999)).toBeUndefined();
    expect(getStaticClinicianVisit(Number.NaN)).toBeUndefined();
    expect(getStaticClinicianVisit(15730.5)).toBeUndefined();
  });

  it('should project consultation links for both static Visits', () => {
    expect(toVisitBoardRows().map((row) => row.href)).toEqual([
      '/visits/15730/assessment',
      '/visits/15731/assessment',
    ]);
  });
});

describe('assessmentReducer', () => {
  it('should mark every Review of Systems finding normal', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const state = createAssessmentState(visit);
    const next = assessmentReducer(state, { type: 'mark-all-normal', target: 'ros' });

    expect(next.ros.every((finding) => finding.status === 'normal')).toBe(true);
  });

  it('should edit the chief complaint without mutating the original Visit', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const state = createAssessmentState(visit);
    const next = assessmentReducer(state, {
      type: 'update-field',
      field: 'chiefComplaint',
      value: 'Updated complaint',
    });

    expect(next.chiefComplaint).toBe('Updated complaint');
    expect(visit.assessment.chiefComplaint).not.toBe('Updated complaint');
  });

  it('should retain visible remarks for an abnormal examination finding', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const state = createAssessmentState(visit);
    const next = assessmentReducer(state, {
      type: 'update-finding',
      target: 'exam',
      id: 'respiratory',
      status: 'abnormal',
    });

    expect(next.exam.find((item) => item.id === 'respiratory')?.remarks).toBeTruthy();
  });

  it('should add and remove a prescription row', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const state = createAssessmentState(visit);
    const added = assessmentReducer(state, { type: 'add-prescription' });
    const addedId = added.prescriptions.at(-1)!.id;
    const removed = assessmentReducer(added, { type: 'remove-prescription', id: addedId });

    expect(added.prescriptions).toHaveLength(state.prescriptions.length + 1);
    expect(removed.prescriptions).toHaveLength(state.prescriptions.length);
  });

  it('should require primary diagnosis and Discharge Disposition for completion', () => {
    const visit = getStaticClinicianVisit(15730)!;
    const state = createAssessmentState(visit);

    expect(canCompleteAssessment({ ...state, diagnoses: [], dischargeDisposition: '' })).toEqual({
      valid: false,
      errors: ['Add a primary diagnosis.', 'Select a Discharge Disposition.'],
    });
  });

  it('should record a draft save timestamp', () => {
    const state = createAssessmentState(getStaticClinicianVisit(15730)!);
    const next = assessmentReducer(state, {
      type: 'save-draft',
      savedAt: '2026-09-09T12:00:00Z',
    });

    expect(next.lastSavedAt).toBe('2026-09-09T12:00:00Z');
  });

  it('should complete a valid active Visit locally', () => {
    const state = createAssessmentState(getStaticClinicianVisit(15730)!);
    const next = assessmentReducer(state, {
      type: 'complete-visit',
      completedAt: '2026-09-09T12:05:00Z',
    });

    expect(next.status).toBe('COMPLETED');
    expect(next.completedAt).toBe('2026-09-09T12:05:00Z');
  });
});
