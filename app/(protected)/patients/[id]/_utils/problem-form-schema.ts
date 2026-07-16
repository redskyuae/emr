import { z } from 'zod';

export const problemFormSchema = z
  .object({
    diagnosisCodeId: z.string(),
    title: z.string().max(255, 'Title must be at most 255 characters'),
    clinicalStatus: z.enum(['active', 'resolved', 'inactive']),
    onsetDate: z.string(),
    resolvedDate: z.string(),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters'),
  })
  .refine((data) => data.diagnosisCodeId !== '' || data.title.trim() !== '', {
    message: 'Select a diagnosis code or enter a free-text title',
    path: ['title'],
  })
  .refine((data) => data.resolvedDate === '' || data.clinicalStatus === 'resolved', {
    message: 'Resolved date is only allowed when the problem is resolved',
    path: ['resolvedDate'],
  });

export type ProblemFormValues = z.infer<typeof problemFormSchema>;

export const problemFormDefaults: ProblemFormValues = {
  diagnosisCodeId: '',
  title: '',
  clinicalStatus: 'active',
  onsetDate: '',
  resolvedDate: '',
  notes: '',
};
