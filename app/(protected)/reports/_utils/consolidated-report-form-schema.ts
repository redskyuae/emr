import { z } from 'zod';

// Matches the API's limit, so a too-long period is caught before the request.
const MAX_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

export const consolidatedReportFormSchema = z
  .object({
    to: z.string().min(1, 'To date is required'),
    from: z.string().min(1, 'From date is required'),
    patientId: z.string().min(1, 'Choose a Patient'),
  })
  .superRefine(({ from, to }, context) => {
    if (!from || !to) return;

    if (from > to) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'From date must be on or before To date',
      });
    } else if ((Date.parse(to) - Date.parse(from)) / DAY_MS + 1 > MAX_DAYS) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: `Report period must be at most ${MAX_DAYS} days`,
      });
    }
  });

export type ConsolidatedReportFormValues = z.infer<typeof consolidatedReportFormSchema>;
