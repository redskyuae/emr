import { z } from 'zod';

// Mirrors the two shapes the check-in API accepts. The form owns the mode, so
// each mode validates only its own required fields.
export const appointmentCheckInFormSchema = z.object({
  bookingNumber: z
    .string()
    .trim()
    .min(1, 'Booking Number is required.')
    .max(20, 'Booking Number must be at most 20 characters.'),
  visitTypeId: z.string().min(1, 'Visit type is required.'),
  chiefComplaint: z.string().trim().max(500, 'Chief complaint must be at most 500 characters.'),
  remarks: z.string().trim(),
});

export const walkInCheckInFormSchema = z.object({
  patientId: z.string().min(1, 'Patient is required.'),
  doctorId: z.string().min(1, 'Doctor is required.'),
  visitTypeId: z.string().min(1, 'Visit type is required.'),
  chiefComplaint: z.string().trim().max(500, 'Chief complaint must be at most 500 characters.'),
  remarks: z.string().trim(),
});

export type AppointmentCheckInFormValues = z.infer<typeof appointmentCheckInFormSchema>;
export type WalkInCheckInFormValues = z.infer<typeof walkInCheckInFormSchema>;
