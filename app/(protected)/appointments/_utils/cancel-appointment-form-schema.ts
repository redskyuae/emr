import { z } from 'zod';

export const cancelAppointmentFormSchema = z.object({
  appointmentCancelledReasonId: z
    .string()
    .trim()
    .min(1, 'Appointment Cancelled Reason is required.')
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 0,
      'Appointment Cancelled Reason is required.'
    )
    .transform(Number),
});

export type CancelAppointmentFormInput = z.input<typeof cancelAppointmentFormSchema>;
export type CancelAppointmentFormValues = z.output<typeof cancelAppointmentFormSchema>;
