import { z } from 'zod';

import { WORK_ORDER_STATUS_CATEGORIES } from '@/app/api/lib/modules/work-order-status/schemas/work-order-status-schema';

export const workOrderStatusFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be at most 100 characters.')
    .regex(
      /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
      'Name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    ),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required.')
    .max(10, 'Code must be at most 10 characters.')
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
      'Code must contain only letters, numbers, hyphens, and underscores.'
    )
    .transform((code) => code.toUpperCase()),
  category: z.enum(WORK_ORDER_STATUS_CATEGORIES, { error: 'Category is required.' }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value like #16A34A.'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters.')
    .transform((description) => (description === '' ? undefined : description))
    .optional(),
});

export type WorkOrderStatusFormValues = z.infer<typeof workOrderStatusFormSchema>;
