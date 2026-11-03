import { z } from 'zod';

import type { ContactStatus } from './outreach-types';

export const FOLLOW_UP_OUTCOMES: Array<{
  value: 'interested' | 'booked' | 'contacted' | 'notint';
  label: string;
  status: ContactStatus;
  needsDate: boolean;
}> = [
  { value: 'interested', label: 'Interested · call again', status: 'sched', needsDate: true },
  { value: 'booked', label: 'Consultation booked', status: 'booked', needsDate: true },
  { value: 'contacted', label: 'Reached · no decision yet', status: 'contacted', needsDate: true },
  { value: 'notint', label: 'Not interested', status: 'closed', needsDate: false },
];

export const followUpFormSchema = z
  .object({
    outcome: z.enum(['interested', 'booked', 'contacted', 'notint']),
    note: z
      .string()
      .trim()
      .min(1, 'Add a short note.')
      .max(500, 'Note must be at most 500 characters.'),
    nextDate: z.string(),
  })
  .superRefine((values, context) => {
    const outcome = FOLLOW_UP_OUTCOMES.find((option) => option.value === values.outcome);

    if (outcome?.needsDate && !values.nextDate) {
      context.addIssue({ code: 'custom', path: ['nextDate'], message: 'Choose the next date.' });
    }
  });

export type FollowUpFormValues = z.infer<typeof followUpFormSchema>;
