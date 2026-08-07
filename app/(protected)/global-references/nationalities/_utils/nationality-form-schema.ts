import { z } from 'zod';

export type NationalityFormValues = {
  name: string;
  code: string;
};

export const nationalityFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(10, 'Code must be at most 10 characters')
    .transform((code) => code.toUpperCase()),
});
