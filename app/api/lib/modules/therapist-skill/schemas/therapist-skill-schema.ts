import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const nameSchema = z
  .string({ error: 'Therapist Skill name is required' })
  .trim()
  .min(1, 'Therapist Skill name cannot be empty')
  .max(100, 'Therapist Skill name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()\/-]+$/u,
    'Therapist Skill name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const codeSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const code = value.trim();
    return code === '' ? undefined : code;
  },
  z
    .string()
    .max(20, 'Therapist Skill code must be at most 20 characters')
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
      'Therapist Skill code must contain only letters, numbers, hyphens, and underscores.'
    )
    .transform((code) => code.toUpperCase())
    .optional()
);

const descriptionSchema = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  const description = value.trim();
  return description === '' ? undefined : description;
}, z.string().max(500, 'Therapist Skill description must be at most 500 characters').optional());

export const therapistSkillIdSchema = z.coerce
  .number({ error: 'Therapist Skill ID is required' })
  .int('Therapist Skill ID must be an integer')
  .positive('Therapist Skill ID must be positive');

export const therapistSkillTenantIdSchema = tenantIdSchema;

export const therapistSkillListParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(999).optional(),
  query: z.string().trim().optional(),
  tenantId: tenantIdSchema,
});

export const createTherapistSkillSchema = z.object({
  name: nameSchema,
  code: codeSchema,
  description: descriptionSchema,
});

export const updateTherapistSkillSchema = createTherapistSkillSchema;

export type TherapistSkill = {
  id: number;
  tenantId: string;
  name: string;
  code: string | null;
  description: string | null;
  createdOn: Date;
  modifiedOn: Date;
};

export type CreateTherapistSkillInput = z.infer<typeof createTherapistSkillSchema>;
export type UpdateTherapistSkillInput = z.infer<typeof updateTherapistSkillSchema>;
export type TherapistSkillListParams = z.infer<typeof therapistSkillListParamsSchema>;
export type CreateTherapistSkillData = CreateTherapistSkillInput & { tenantId: string };
export type UpdateTherapistSkillData = UpdateTherapistSkillInput & { tenantId: string };
