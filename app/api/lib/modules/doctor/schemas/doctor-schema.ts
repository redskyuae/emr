import { z } from 'zod';

import type { StaffGender } from '../../staff/schemas/staff-schema';

const DOCTOR_GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const optionalTrimmedString = (schema: z.ZodString) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, schema.optional());

const nullableTrimmedString = (schema: z.ZodString) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }, schema.nullable().optional());

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isPastDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return date < today;
}

const dateOfBirthSchema = z
  .string({ error: 'Date of birth must be a valid date' })
  .trim()
  .refine(isValidDateOnly, 'Date of birth must be a valid date')
  .refine(isPastDate, 'Date of birth must be in the past');

const nameSchema = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name must be at most 100 characters');

const emailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .min(1, 'Email is required')
  .email('Email must be valid');

const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const genderSchema = z.enum(DOCTOR_GENDERS, { error: 'Gender is invalid' });
const staffCodeSchema = z.string().trim().max(20, 'Staff code must be at most 20 characters');
const designationSchema = z.string().trim().max(100, 'Designation must be at most 100 characters');
const registrationNumberSchema = z
  .string()
  .trim()
  .max(100, 'Doctor registration number must be at most 100 characters');
const qualificationsSchema = z.string().trim();

export const doctorIdSchema = z.coerce
  .number({ error: 'Doctor ID is required' })
  .int('Doctor ID must be an integer')
  .positive('Doctor ID must be positive');

export const doctorTenantIdSchema = tenantIdSchema;

export const createDoctorSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    specialtyId: z.coerce
      .number({ error: 'Specialty is required.' })
      .int('Specialty ID must be an integer')
      .positive('Specialty ID must be positive'),
    gender: z.preprocess((value) => {
      if (typeof value !== 'string') {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    }, genderSchema.optional()),
    dateOfBirth: z.preprocess((value) => {
      if (typeof value !== 'string') {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    }, dateOfBirthSchema.optional()),
    staffCode: optionalTrimmedString(staffCodeSchema),
    designation: optionalTrimmedString(designationSchema),
    qualifications: optionalTrimmedString(qualificationsSchema),
    registrationNumber: optionalTrimmedString(registrationNumberSchema),
  })
  .strict();

export const updateDoctorSchema = z
  .object({
    name: nameSchema.optional(),
    specialtyId: z.coerce
      .number()
      .int('Specialty ID must be an integer')
      .positive('Specialty ID must be positive')
      .optional(),
    gender: z.preprocess((value) => {
      if (typeof value !== 'string') {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }, genderSchema.nullable().optional()),
    dateOfBirth: z.preprocess((value) => {
      if (typeof value !== 'string') {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }, dateOfBirthSchema.nullable().optional()),
    staffCode: nullableTrimmedString(staffCodeSchema),
    designation: nullableTrimmedString(designationSchema),
    qualifications: nullableTrimmedString(qualificationsSchema),
    registrationNumber: nullableTrimmedString(registrationNumberSchema),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one Doctor field is required',
  });

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

export type Doctor = {
  id: number;
  name: string;
  email: string;
  userId: string;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  isActive: boolean;
  phone: string | null;
  staffCode: string | null;
  designation: string | null;
  gender: StaffGender | null;
  dateOfBirth: string | null;
  specialtyId: number;
  specialtyName: string;
  qualifications: string | null;
  registrationNumber: string | null;
};

export type DoctorStatusFilter = 'active' | 'inactive';

export type DoctorListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
  specialtyId?: number;
  status?: DoctorStatusFilter;
};

export type CreateDoctorData = CreateDoctorInput & {
  userId: string;
  tenantId: string;
  roleId: number;
  assignedBy: string;
};

export type UpdateDoctorData = UpdateDoctorInput & {
  tenantId: string;
};
