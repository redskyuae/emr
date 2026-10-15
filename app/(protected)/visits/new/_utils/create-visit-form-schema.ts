import { z } from 'zod';

export const createVisitFormSchema = z
  .object({
    mode: z.enum(['appointment', 'walk-in']),
    appointmentId: z.string(),
    patientId: z.string(),
    doctorId: z.string(),
    visitTypeId: z.string().min(1, 'Visit type is required.'),
    chiefComplaint: z.string().trim().max(500, 'Chief complaint must be at most 500 characters.'),
    remarks: z.string().trim(),
  })
  .superRefine((values, context) => {
    if (values.mode === 'appointment' && !values.appointmentId) {
      context.addIssue({
        code: 'custom',
        path: ['appointmentId'],
        message: 'Appointment is required.',
      });
    }
    if (values.mode === 'walk-in' && !values.patientId) {
      context.addIssue({ code: 'custom', path: ['patientId'], message: 'Patient is required.' });
    }
    if (values.mode === 'walk-in' && !values.doctorId) {
      context.addIssue({ code: 'custom', path: ['doctorId'], message: 'Doctor is required.' });
    }
  });

export type CreateVisitFormValues = z.infer<typeof createVisitFormSchema>;
