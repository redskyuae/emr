import type { ClinicalNoteType } from '@/app/api/lib/modules/clinical-note-type/schemas/clinical-note-type-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListClinicalNoteTypesResponse = Paginated<ClinicalNoteType>;

export type SaveClinicalNoteTypeRequest = {
  name: string;
  code: string;
  description?: string;
};

export type SaveClinicalNoteTypeResponse = {
  data: ClinicalNoteType;
};
