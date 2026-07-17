import { z } from 'zod';

// Client-side mirror of the create/update VisitType contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const visitTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Visit type name is required.')
    .max(100, 'Visit type name must be at most 100 characters.'),
  code: z
    .string()
    .trim()
    .min(1, 'Visit type code is required.')
    .max(10, 'Visit type code must be at most 10 characters.'),
  description: z.string().trim(),
});

export type VisitTypeFormValues = z.infer<typeof visitTypeFormSchema>;
