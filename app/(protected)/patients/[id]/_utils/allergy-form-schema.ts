import { z } from 'zod';

export const allergyFormSchema = z
  .object({
    allergenId: z.string(),
    substance: z.string().max(150, 'Substance must be at most 150 characters'),
    reaction: z.string().max(255, 'Reaction must be at most 255 characters'),
    severity: z.enum(['mild', 'moderate', 'severe'], { error: 'Select a severity' }),
    status: z.enum(['active', 'inactive', 'resolved']),
    notedOn: z.string(),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters'),
  })
  .refine((data) => data.allergenId !== '' || data.substance.trim() !== '', {
    message: 'Select an allergen or enter a free-text substance',
    path: ['substance'],
  });

export type AllergyFormValues = z.infer<typeof allergyFormSchema>;

export const allergyFormDefaults: AllergyFormValues = {
  allergenId: '',
  substance: '',
  reaction: '',
  severity: 'moderate',
  status: 'active',
  notedOn: '',
  notes: '',
};
