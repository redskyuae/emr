import { z } from 'zod';

// Client-side mirror of the admit-Patient API contract: patient, doctor,
// admission type, and bed are required; the rest is optional.
export const admitFormSchema = z.object({
  patientId: z.string().min(1, 'Patient is required.'),
  doctorId: z.string().min(1, 'Doctor is required.'),
  admissionTypeId: z.string().min(1, 'Admission type is required.'),
  wardId: z.string().min(1, 'Ward is required.'),
  bedId: z.string().min(1, 'Bed is required.'),
  admissionReason: z.string().trim().max(500, 'Admission reason must be at most 500 characters.'),
  expectedDischargeDate: z.string(),
});

export type AdmitFormValues = z.infer<typeof admitFormSchema>;
