import { z } from 'zod';

export const INTEREST_OPTIONS = [
  { value: 'consult', label: 'Ayurveda consultation' },
  { value: 'therapy', label: 'Therapy (Panchakarma, Abhyanga…)' },
  { value: 'wellness', label: 'Wellness program' },
  { value: 'diet', label: 'Diet & lifestyle' },
  { value: 'other', label: 'Other' },
];

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(120, 'Name must be at most 120 characters.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .refine(
      (value) => /^\d{10}$/.test(value.replace(/\D/g, '')),
      'Enter a 10-digit mobile number.'
    ),
  address: z.string().trim().max(240, 'Address must be at most 240 characters.'),
  interests: z.array(z.string()),
  notes: z.string().trim().max(1000, 'Notes must be at most 1000 characters.'),
  consent: z.boolean(),
  activityId: z.string().min(1, 'Choose the activity this contact came from.'),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
