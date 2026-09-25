import { z } from 'zod';
import { createTherapistSkillSchema } from '@/app/api/lib/modules/therapist-skill/schemas/therapist-skill-schema';

export const therapistSkillFormSchema = z.object({
  name: createTherapistSkillSchema.shape.name,
  code: z
    .string()
    .trim()
    .min(1, 'Therapist Skill code is required')
    .max(20, 'Therapist Skill code must be at most 20 characters')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'Therapist Skill code must contain only letters, numbers, hyphens, and underscores.'
    ),
});

export type TherapistSkillFormValues = z.infer<typeof therapistSkillFormSchema>;
