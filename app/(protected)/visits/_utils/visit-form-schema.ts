import { z } from 'zod';

export const visitCheckInFormSchema = z.object({
  patientId: z.number({ error: 'Patient is required' }).int().positive(),
  doctorId: z.number().int().positive().optional(),
  appointmentTypeId: z.number({ error: 'Appointment type is required' }).int().positive(),
  appointmentReasonId: z.number().int().positive().optional(),
  chiefComplaint: z.string().trim().max(500, 'Chief complaint must be at most 500 characters'),
  notes: z.string().trim().max(2000, 'Notes must be at most 2000 characters'),
});

export type VisitCheckInFormValues = z.infer<typeof visitCheckInFormSchema>;

export const visitEditFormSchema = z.object({
  doctorId: z.number().int().positive().optional(),
  appointmentTypeId: z.number({ error: 'Appointment type is required' }).int().positive(),
  appointmentReasonId: z.number().int().positive().optional(),
  chiefComplaint: z.string().trim().max(500, 'Chief complaint must be at most 500 characters'),
  notes: z.string().trim().max(2000, 'Notes must be at most 2000 characters'),
});

export type VisitEditFormValues = z.infer<typeof visitEditFormSchema>;
