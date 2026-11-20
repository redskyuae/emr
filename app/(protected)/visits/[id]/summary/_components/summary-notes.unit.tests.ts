import { describe, expect, it } from 'vitest';

import type { VisitSummaryNote } from '@/app/api/lib/modules/visit/schemas/visit-summary-schema';

import { type SummaryBlock, clinicalNoteBlocks, consultationBlocks } from './summary-notes';

const TIME_ZONE = 'Asia/Kolkata';

function signedNote(id: number, sections: Partial<VisitSummaryNote>): VisitSummaryNote {
  return {
    id,
    plan: null,
    objective: null,
    subjective: null,
    assessment: null,
    amendedAt: null,
    authorName: 'Dr. Meera Nair',
    signedAt: new Date('2026-11-18T05:30:00Z'),
    noteType: { name: 'Progress Note', code: 'PROG' },
    ...sections,
  };
}

// Key, spacing and whether a "continued" heading is ready for a page break.
function layout(blocks: SummaryBlock[]) {
  return blocks.map(({ key, spacing, continued }) => [key, spacing, Boolean(continued)]);
}

describe('clinicalNoteBlocks', () => {
  it('should split each note into rows with headings on the first row of each group', () => {
    const progress = signedNote(1, {
      subjective: '**Present condition:**\n\nLess stiffness\n\n**Sleep:**\n\nSleeping through',
      plan: 'Continue Rasnadi kashaya',
    });
    const discharge = signedNote(2, {
      plan: 'Review in two weeks',
      noteType: { name: 'Discharge Summary', code: 'DISCH' },
    });

    expect(
      layout(clinicalNoteBlocks({ notes: [progress, discharge], timeZone: TIME_ZONE }))
    ).toEqual([
      ['note-1-subjective-0', 'section', false],
      ['note-1-subjective-1', 'row', true],
      ['note-1-plan-0', 'group', true],
      ['note-2-plan-0', 'section', false],
    ]);
  });

  it('should skip a note with nothing to print', () => {
    const empty = signedNote(3, {});
    const progress = signedNote(4, { plan: 'Continue Rasnadi kashaya' });

    expect(layout(clinicalNoteBlocks({ notes: [empty, progress], timeZone: TIME_ZONE }))).toEqual([
      ['note-4-plan-0', 'section', false],
    ]);
  });

  it('should return no blocks when there are no notes', () => {
    expect(clinicalNoteBlocks({ notes: [], timeZone: TIME_ZONE })).toEqual([]);
  });
});

describe('consultationBlocks', () => {
  it('should print the chief complaint at check-in when there is no signed consultation', () => {
    const blocks = consultationBlocks({
      note: null,
      timeZone: TIME_ZONE,
      chiefComplaint: 'Low back pain for two weeks',
    });

    expect(layout(blocks)).toEqual([['consultation-subjective-0', 'section', false]]);
  });

  it('should end a signed consultation with its signature block', () => {
    const note = signedNote(5, {
      subjective: 'Low back pain for two weeks',
      assessment: 'Kati shoola',
      noteType: { name: 'Consultation', code: 'CONS' },
    });

    expect(layout(consultationBlocks({ note, chiefComplaint: null, timeZone: TIME_ZONE }))).toEqual(
      [
        ['consultation-subjective-0', 'section', false],
        ['consultation-assessment-0', 'group', true],
        ['consultation-signature', 'group', true],
      ]
    );
  });
});
