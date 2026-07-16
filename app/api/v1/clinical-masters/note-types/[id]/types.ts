import type { ClinicalNoteType } from '@/app/api/lib/modules/clinical-note-type/schemas/clinical-note-type-schema';

export type GetClinicalNoteTypeResponse = {
  data: ClinicalNoteType;
};

export type UpdateClinicalNoteTypeRequest = {
  name: string;
  code: string;
  description?: string;
};

export type UpdateClinicalNoteTypeResponse = {
  data: ClinicalNoteType;
};

export type DeleteClinicalNoteTypeResponse = void;
