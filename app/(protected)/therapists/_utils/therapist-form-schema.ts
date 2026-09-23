import { z } from 'zod';

export const therapistFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Email must be valid'),
  password: z.string().max(128).optional(),
  phone: z.string().trim().optional(),
  staffCode: z.string().trim().max(20).optional(),
  designation: z.string().trim().max(100).optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  dateOfBirth: z.string().optional(),
  qualifications: z.string().trim().optional(),
  registrationNumber: z.string().trim().max(100).optional(),
  therapistSkillIds: z.array(z.number().int().positive()),
});

export type TherapistFormValues = z.infer<typeof therapistFormSchema>;
