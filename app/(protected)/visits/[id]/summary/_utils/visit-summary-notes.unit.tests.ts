import { describe, expect, it } from 'vitest';

import { dailyTreatmentToSoap } from '../../_utils/daily-treatment-note';
import { EMPTY_CONSULTATION, consultationToSoap } from '../../_utils/doctor-consultation-note';
import {
  consultationGroups,
  latestConsultationNote,
  latestTreatmentNote,
  otherClinicalNotes,
  parseLabelled,
  treatmentResponse,
} from './visit-summary-notes';

function note(sections: ReturnType<typeof consultationToSoap>, code = 'CONS') {
  return {
    plan: sections.plan ?? null,
    objective: sections.objective ?? null,
    subjective: sections.subjective,
    assessment: sections.assessment ?? null,
    noteType: { code },
  };
}

// A free-text note, as the Clinical notes sheet writes it.
function freeNote(code: string) {
  return {
    subjective: 'Reviewed after Abhyanga',
    objective: null,
    assessment: null,
    plan: 'Continue Rasnadi kashaya',
    noteType: { code },
  };
}

describe('parseLabelled', () => {
  it('should split labelled blocks and keep text before the first label as lead', () => {
    expect(parseLabelled('Intro\n\n**One:**\n\nFirst\n\nmore\n\n**Two:**\n\nSecond')).toEqual({
      lead: 'Intro',
      sections: [
        { label: 'One', value: 'First\n\nmore' },
        { label: 'Two', value: 'Second' },
      ],
    });
  });

  it('should return unlabelled text as lead only', () => {
    expect(parseLabelled('Free text note')).toEqual({ lead: 'Free text note', sections: [] });
    expect(parseLabelled(null)).toEqual({ lead: '', sections: [] });
  });
});

describe('consultationGroups', () => {
  it('should read back the consultation form with Patient copy labels and no history', () => {
    const soap = consultationToSoap({
      ...EMPTY_CONSULTATION,
      noteTypeId: '1',
      chiefComplaint: 'Low back pain',
      hpi: 'Worse in the morning',
      medicalHistory: 'Diabetes since 2015',
      examination: 'SLR positive',
      prakriti: 'Vata-Pitta',
      vikriti: 'Vata aggravation',
      modernDiagnosis: 'Lumbar radiculopathy',
      ayurvedicDiagnosis: 'Gridhrasi',
      precautions: 'Avoid lifting',
    });

    expect(consultationGroups(note(soap))).toEqual([
      {
        key: 'subjective',
        rows: [
          { label: 'Chief complaint', value: 'Low back pain' },
          { label: 'Present condition', value: 'Worse in the morning' },
        ],
      },
      {
        key: 'objective',
        rows: [
          { label: 'Examination', value: 'SLR positive' },
          { label: 'Prakriti', value: 'Vata-Pitta' },
          { label: 'Vikriti', value: 'Vata aggravation' },
        ],
      },
      {
        key: 'assessment',
        rows: [
          { label: 'Modern diagnosis', value: 'Lumbar radiculopathy' },
          { label: 'Ayurvedic diagnosis', value: 'Gridhrasi' },
        ],
      },
      { key: 'plan', rows: [{ label: 'Precautions', value: 'Avoid lifting' }] },
    ]);
  });

  it('should leave every history section written by the form off the Patient copy', () => {
    const soap = consultationToSoap({
      ...EMPTY_CONSULTATION,
      noteTypeId: '1',
      chiefComplaint: 'Low back pain',
      medicalHistory: 'Diabetes since 2015',
      surgicalHistory: 'Appendectomy 2010',
      familySocialHistory: 'Father hypertensive',
    });

    expect(consultationGroups(note(soap))).toEqual([
      { key: 'subjective', rows: [{ label: 'Chief complaint', value: 'Low back pain' }] },
    ]);
  });

  it('should show a free-text note without row labels and drop empty sections', () => {
    expect(
      consultationGroups({
        subjective: 'Cough for 3 days',
        objective: null,
        assessment: null,
        plan: '',
        noteType: { code: 'PROG' },
      })
    ).toEqual([{ key: 'subjective', rows: [{ label: '', value: 'Cough for 3 days' }] }]);
  });
});

describe('treatment notes', () => {
  const session = { label: 'Day 1', procedure: 'Abhyanga', sessionNumber: 1 };
  const treatment = {
    ...dailyTreatmentToSoap(
      {
        actualMinutes: '50',
        response: 'Stiffness eased.\n\nAble to sit for 30 minutes.',
        painScore: '4',
        variations: 'Swedana shortened to 10 min.',
        adverseEvents: '',
      },
      session
    ),
    plan: null,
    assessment: null,
    noteType: { code: 'PROG' },
  };

  it('should read back what the Daily Treatment Session sheet wrote', () => {
    expect(treatmentResponse(treatment)).toEqual({
      response: 'Stiffness eased.\n\nAble to sit for 30 minutes.',
      painScore: 4,
      variations: 'Swedana shortened to 10 min.',
      actualMinutes: 50,
      adverseEvents: null,
    });
  });

  it('should read back adverse events the Daily Treatment Session sheet wrote', () => {
    const withEvent = dailyTreatmentToSoap(
      {
        actualMinutes: '',
        response: 'Improved',
        painScore: '',
        variations: '',
        adverseEvents: 'Mild dizziness after Swedana.',
      },
      session
    );

    expect(
      treatmentResponse({ ...withEvent, plan: null, assessment: null, noteType: { code: 'PROG' } })
    ).toMatchObject({ adverseEvents: 'Mild dizziness after Swedana.', variations: null });
  });

  it('should leave out pain score and duration when they were not recorded', () => {
    const minimal = dailyTreatmentToSoap(
      { actualMinutes: '', response: 'Improved', painScore: '', variations: '', adverseEvents: '' },
      session
    );

    expect(
      treatmentResponse({ ...minimal, plan: null, assessment: null, noteType: { code: 'PROG' } })
    ).toMatchObject({ response: 'Improved', painScore: null, actualMinutes: null });
  });

  it('should tell consultation notes from treatment notes and take the latest of each', () => {
    const first = note(consultationToSoap({ ...EMPTY_CONSULTATION, chiefComplaint: 'First' }));
    const second = note(
      consultationToSoap({ ...EMPTY_CONSULTATION, chiefComplaint: 'Second' }),
      'PROG'
    );
    const notes = [first, treatment, second];

    expect(latestConsultationNote(notes)).toBe(second);
    expect(latestTreatmentNote(notes)).toBe(treatment);
    expect(latestConsultationNote([treatment])).toBeNull();
    expect(latestTreatmentNote([first])).toBeNull();
  });

  it('should print only Patient-facing note types, not consultations, Treatment Sessions or care-team notes', () => {
    const consultation = note(
      consultationToSoap({ ...EMPTY_CONSULTATION, chiefComplaint: 'Pain' })
    );
    const progress = freeNote('PROG');
    const discharge = freeNote('DISCH');
    const handoff = freeNote('NURS');

    expect(
      otherClinicalNotes([consultation, progress, treatment, handoff, discharge, freeNote('CONS')])
    ).toEqual([progress, discharge]);
    expect(otherClinicalNotes([consultation, treatment, handoff])).toEqual([]);
  });

  it('should leave out a note type the Patient copy does not list', () => {
    expect(otherClinicalNotes([freeNote('INTERNAL'), freeNote('PSYCH')])).toEqual([]);
  });

  it('should match Patient-facing note type codes case-insensitively', () => {
    const progress = freeNote('prog');
    const discharge = freeNote('Disch');
    const handoff = freeNote('nurs');

    expect(otherClinicalNotes([progress, handoff, discharge])).toEqual([progress, discharge]);
  });
});
