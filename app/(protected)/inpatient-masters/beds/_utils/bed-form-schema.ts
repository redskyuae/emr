import { z } from 'zod';

import { MANUAL_BED_STATUSES } from '@/app/api/lib/modules/bed/schemas/bed-schema';

// Client-side mirror of the create/update Bed contract. Bed number and ward are
// required; OCCUPIED is system-managed and never offered.
export const bedFormSchema = z.object({
  bedNumber: z
    .string()
    .trim()
    .min(1, 'Bed number is required.')
    .max(20, 'Bed number must be at most 20 characters.'),
  wardId: z.string().min(1, 'Ward is required.'),
  roomId: z.string(),
  status: z.enum(MANUAL_BED_STATUSES, { error: 'Status is required.' }),
  notes: z.string().trim().max(500, 'Bed notes must be at most 500 characters.'),
});

export type BedFormValues = z.infer<typeof bedFormSchema>;
