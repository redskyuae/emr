import { z } from 'zod';

export const roomTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be at most 100 characters.'),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required.')
    .max(10, 'Code must be at most 10 characters.'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value like #2563EB.'),
  dailyRate: z
    .string()
    .trim()
    .refine((value) => value === '' || !Number.isNaN(Number(value)), 'Daily rate must be a number.')
    .refine((value) => value === '' || Number(value) >= 0, 'Daily rate must be non-negative.'),
  description: z.string().trim(),
});

export type RoomTypeFormValues = z.infer<typeof roomTypeFormSchema>;
