import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';

export type SignClinicalNoteResponse = {
  data: ClinicalNote;
};
