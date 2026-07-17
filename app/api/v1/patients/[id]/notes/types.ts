import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListClinicalNotesResponse = Paginated<ClinicalNote>;

export type SaveClinicalNoteRequest = {
  noteTypeId: number;
  visitId?: number;
  admissionId?: number;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
};

export type SaveClinicalNoteResponse = {
  data: ClinicalNote;
};
