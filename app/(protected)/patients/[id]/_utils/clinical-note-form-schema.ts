import { z } from 'zod';

const SOAP_KEYS = ['subjective', 'objective', 'assessment', 'plan'] as const;

export const clinicalNoteFormSchema = z
  .object({
    noteTypeId: z.string().min(1, 'Select a note type'),
    subjective: z.string().max(20000, 'Subjective must be at most 20000 characters'),
    objective: z.string().max(20000, 'Objective must be at most 20000 characters'),
    assessment: z.string().max(20000, 'Assessment must be at most 20000 characters'),
    plan: z.string().max(20000, 'Plan must be at most 20000 characters'),
  })
  .refine((data) => SOAP_KEYS.some((key) => data[key].trim() !== ''), {
    message: 'Enter at least one section (Subjective, Objective, Assessment, or Plan)',
    path: ['subjective'],
  });

export type ClinicalNoteFormValues = z.infer<typeof clinicalNoteFormSchema>;

export const clinicalNoteFormDefaults: ClinicalNoteFormValues = {
  noteTypeId: '',
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
};
