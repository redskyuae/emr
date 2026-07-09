import { z } from 'zod';

import { VISIT_STATUS_CATEGORIES } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';

export const visitStatusFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be at most 100 characters.'),
  code: z.string().trim().min(1, 'Code is required.').max(10, 'Code must be at most 10 characters.'),
  category: z.enum(VISIT_STATUS_CATEGORIES, { error: 'Category is required.' }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value like #2563EB.'),
  description: z.string().trim(),
});

export type VisitStatusFormValues = z.infer<typeof visitStatusFormSchema>;

export const VISIT_STATUS_CATEGORY_LABELS: Record<(typeof VISIT_STATUS_CATEGORIES)[number], string> = {
  WAITING: 'Waiting',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
