import { z } from 'zod';

import type { StaffGender } from '../../staff/schemas/staff-schema';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

const optionalTrimmedString = (schema: z.ZodString) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, schema.optional());

const nullableTrimmedString = (schema: z.ZodString) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }, schema.nullable().optional());

const dateOnly = z
  .string({ error: 'Date of birth must be a valid date' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be a valid date');

const nameSchema = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name must be at most 100 characters');
const emailSchema = z.string({ error: 'Email is required' }).trim().email('Email must be valid');
const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');
const registrationNumberSchema = z
  .string()
  .trim()
  .max(100, 'Therapist registration number must be at most 100 characters');
const genderSchema = z.enum(GENDERS, { error: 'Gender is invalid' });
const skillIdsSchema = z.array(
  z.coerce.number().int().positive('Therapist Skill ID must be positive')
);

export const therapistIdSchema = z.coerce
  .number({ error: 'Therapist ID is required' })
  .int('Therapist ID must be an integer')
  .positive('Therapist ID must be positive');

export const therapistTenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

export const therapistListParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(999).optional(),
  query: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  therapistSkillId: z.coerce.number().int().positive().optional(),
  tenantId: therapistTenantIdSchema,
});

export const createTherapistSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    phone: optionalTrimmedString(z.string().trim()),
    staffCode: optionalTrimmedString(
      z.string().trim().max(20, 'Staff code must be at most 20 characters')
    ),
    designation: optionalTrimmedString(
      z.string().trim().max(100, 'Designation must be at most 100 characters')
    ),
    gender: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      genderSchema.optional()
    ),
    dateOfBirth: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      dateOnly.optional()
    ),
    qualifications: optionalTrimmedString(z.string().trim()),
    registrationNumber: optionalTrimmedString(registrationNumberSchema),
    therapistSkillIds: skillIdsSchema.optional().default([]),
  })
  .strict();

export const updateTherapistSchema = z
  .object({
    name: nameSchema.optional(),
    phone: nullableTrimmedString(z.string().trim()),
    staffCode: nullableTrimmedString(
      z.string().trim().max(20, 'Staff code must be at most 20 characters')
    ),
    designation: nullableTrimmedString(
      z.string().trim().max(100, 'Designation must be at most 100 characters')
    ),
    gender: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
      genderSchema.nullable().optional()
    ),
    dateOfBirth: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
      dateOnly.nullable().optional()
    ),
    qualifications: nullableTrimmedString(z.string().trim()),
    registrationNumber: nullableTrimmedString(registrationNumberSchema),
    therapistSkillIds: skillIdsSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one Therapist field is required',
  });

export type CreateTherapistInput = z.infer<typeof createTherapistSchema>;
export type UpdateTherapistInput = z.infer<typeof updateTherapistSchema>;
export type TherapistListParams = z.infer<typeof therapistListParamsSchema>;
export type TherapistSkillSummary = { id: number; name: string; code: string | null };
export type Therapist = {
  id: number;
  tenantId: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  staffCode: string | null;
  designation: string | null;
  gender: StaffGender | null;
  dateOfBirth: string | null;
  qualifications: string | null;
  registrationNumber: string | null;
  isActive: boolean;
  createdOn: Date;
  modifiedOn: Date;
  skills: TherapistSkillSummary[];
};

export type CreateTherapistData = CreateTherapistInput & {
  userId: string;
  tenantId: string;
  assignedBy: string;
  roleId: number;
};
export type UpdateTherapistData = UpdateTherapistInput & { tenantId: string };
