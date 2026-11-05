import { z } from 'zod';

// Client-side mirror of the create/update Ayurveda Diagnosis Code contract. Code and title are
// required; the API schema stays the server contract.
export const ayurvedaDiagnosisCodeFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required.')
    .max(20, 'Code must be at most 20 characters.')
    .transform((code) => code.toUpperCase()),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(255, 'Title must be at most 255 characters.'),
  category: z.string().trim().max(100, 'Category must be at most 100 characters.'),
});

export type AyurvedaDiagnosisCodeFormInput = z.input<typeof ayurvedaDiagnosisCodeFormSchema>;
export type AyurvedaDiagnosisCodeFormValues = z.output<typeof ayurvedaDiagnosisCodeFormSchema>;
