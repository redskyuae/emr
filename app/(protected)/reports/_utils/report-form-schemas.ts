import { z } from 'zod';

export const visitRegisterReportFormSchema = z
  .object({
    to: z.string().min(1, 'To date is required'),
    from: z.string().min(1, 'From date is required'),
  })
  .refine((values) => !values.from || !values.to || values.from <= values.to, {
    message: 'From date must be on or before To date',
    path: ['to'],
  });

export type VisitRegisterReportFormValues = z.infer<typeof visitRegisterReportFormSchema>;

export const doctorVisitSummaryReportFormSchema = z.object({
  month: z.string().min(1, 'Month is required'),
});

export type DoctorVisitSummaryReportFormValues = z.infer<typeof doctorVisitSummaryReportFormSchema>;
