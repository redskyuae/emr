import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';

export type AmendVisitClinicalNoteRequest = {
  plan?: string;
  objective?: string;
  noteTypeId: number;
  subjective?: string;
  assessment?: string;
};

export type AmendVisitClinicalNoteResponse = {
  data: ClinicalNote;
};
