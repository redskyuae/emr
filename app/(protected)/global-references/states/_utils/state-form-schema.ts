import { z } from 'zod';

export type StateFormValues = {
  name: string;
  countryId: string;
};

export const stateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  countryId: z.string().min(1, 'Country is required'),
});
