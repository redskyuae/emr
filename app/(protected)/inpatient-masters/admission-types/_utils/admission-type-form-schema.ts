import { z } from 'zod';

// Client-side mirror of the create/update AdmissionType contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const admissionTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Admission type name is required.')
    .max(100, 'Admission type name must be at most 100 characters.'),
  code: z
    .string()
    .trim()
    .min(1, 'Admission type code is required.')
    .max(10, 'Admission type code must be at most 10 characters.'),
  description: z.string().trim(),
});

export type AdmissionTypeFormValues = z.infer<typeof admissionTypeFormSchema>;
