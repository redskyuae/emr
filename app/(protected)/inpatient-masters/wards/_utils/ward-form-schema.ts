import { z } from 'zod';

// Client-side mirror of the create/update Ward contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const wardFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Ward name is required.')
    .max(100, 'Ward name must be at most 100 characters.'),
  code: z
    .string()
    .trim()
    .min(1, 'Ward code is required.')
    .max(10, 'Ward code must be at most 10 characters.'),
  description: z.string().trim(),
});

export type WardFormValues = z.infer<typeof wardFormSchema>;
