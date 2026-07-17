import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';

export type GetClinicalNoteResponse = {
  data: ClinicalNote;
};

export type UpdateClinicalNoteRequest = {
  noteTypeId: number;
  visitId?: number;
  admissionId?: number;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
};

export type UpdateClinicalNoteResponse = {
  data: ClinicalNote;
};

export type DeleteClinicalNoteResponse = void;
