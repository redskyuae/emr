import { describe, expect, it } from 'vitest';

import {
  getStaticClinicianVisit,
  staticClinicianVisits,
  toVisitBoardRows,
} from '../../../_data/static-clinician-visits';
import {
  assessmentReducer,
  canCompleteAssessment,
  createAssessmentState,
} from './assessment-state';

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

  it('should edit clinical row fields and allow a replacement primary diagnosis', () => {
    const state = createAssessmentState(getStaticClinicianVisit(15730)!);
    const added = assessmentReducer(state, { type: 'add-diagnosis' });
    const id = added.diagnoses.at(-1)!.id;
    const described = assessmentReducer(added, {
      type: 'update-diagnosis',
      id,
      field: 'description',
      value: 'Replacement diagnosis',
    });
    const primary = assessmentReducer(described, {
      type: 'update-diagnosis',
      id,
      field: 'primary',
      value: true,
    });

    expect(primary.diagnoses.find((row) => row.id === id)).toMatchObject({
      description: 'Replacement diagnosis',
      primary: true,
    });
  });

  it('should edit vitals, prescription details, MDM, and Patient education', () => {
    const state = createAssessmentState(getStaticClinicianVisit(15730)!);
    const vital = assessmentReducer(state, {
      type: 'update-vital',
      field: 'pulse',
      value: '90',
    });
    const prescription = assessmentReducer(vital, {
      type: 'update-prescription',
      id: vital.prescriptions[0].id,
      field: 'refill',
      value: '1',
    });
    const mdm = assessmentReducer(prescription, {
      type: 'update-mdm',
      field: 'risk',
      value: 'High',
    });
    const education = assessmentReducer(mdm, {
      type: 'toggle-education',
      item: 'Warning signs',
    });

    expect(education.vitals.pulse).toBe('90');
    expect(education.prescriptions[0].refill).toBe('1');
    expect(education.mdm.risk).toBe('High');
    expect(education.education).not.toContain('Warning signs');
  });

  it('should manually add, edit, and remove Problems and allergies', () => {
    const state = createAssessmentState(getStaticClinicianVisit(15730)!);
    const withProblem = assessmentReducer(state, { type: 'add-problem' });
    const editedProblem = assessmentReducer(withProblem, {
      type: 'update-problem',
      index: withProblem.problems.length - 1,
      value: 'I10 · Hypertension',
    });
    const withAllergy = assessmentReducer(editedProblem, { type: 'add-allergy' });
    const editedAllergy = assessmentReducer(withAllergy, {
      type: 'update-allergy',
      index: withAllergy.allergies.length - 1,
      value: 'Latex — contact rash',
    });
    const removed = assessmentReducer(editedAllergy, {
      type: 'remove-problem',
      index: editedAllergy.problems.length - 1,
    });

    expect(editedAllergy.problems).toContain('I10 · Hypertension');
    expect(editedAllergy.allergies).toContain('Latex — contact rash');
    expect(removed.problems).not.toContain('I10 · Hypertension');
  });

  it('should manually edit history, abnormal remarks, and Ayurveda findings', () => {
    const state = createAssessmentState(getStaticClinicianVisit(15730)!);
    const history = assessmentReducer(state, {
      type: 'update-history-summary',
      field: 'smoking',
      value: 'Former smoker',
    });
    const finding = assessmentReducer(history, {
      type: 'update-finding-remarks',
      target: 'ros',
      id: 'respiratory',
      remarks: 'Productive cough',
    });
    const ayurveda = assessmentReducer(finding, {
      type: 'update-ayurveda',
      field: 'vikriti',
      value: 'Kapha increased',
    });

    expect(ayurveda.historySummary.smoking).toBe('Former smoker');
    expect(ayurveda.ros.find((item) => item.id === 'respiratory')?.remarks).toBe(
      'Productive cough'
    );
    expect(ayurveda.ayurveda.vikriti).toBe('Kapha increased');
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
