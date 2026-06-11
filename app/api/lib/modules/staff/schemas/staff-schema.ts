import { z } from 'zod';

const STAFF_GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

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

const optionalDateOfBirthSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}, dateOfBirthSchema.optional());

const nullableDateOfBirthSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}, dateOfBirthSchema.nullable().optional());

const staffNameSchema = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name must be at most 100 characters');

const staffEmailSchema = z
  .string({ error: 'Email is required' })
  .trim()
  .min(1, 'Email is required')
  .email('Email must be valid');

const staffPasswordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const staffPhoneSchema = z.string().trim();
const staffCodeSchema = z.string().trim().max(20, 'Staff code must be at most 20 characters');
const designationSchema = z.string().trim().max(100, 'Designation must be at most 100 characters');
const genderSchema = z.enum(STAFF_GENDERS, { error: 'Gender is invalid' });

export const staffUserIdSchema = z
  .string({ error: 'Staff ID is required' })
  .trim()
  .min(1, 'Staff ID is required');

export const createStaffSchema = z.object({
  name: staffNameSchema,
  email: staffEmailSchema,
  password: staffPasswordSchema,
  phone: optionalTrimmedString(staffPhoneSchema),
  staffCode: optionalTrimmedString(staffCodeSchema),
  designation: optionalTrimmedString(designationSchema),
  gender: z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, genderSchema.optional()),
  dateOfBirth: optionalDateOfBirthSchema,
});

export const updateStaffSchema = z
  .object({
    name: staffNameSchema.optional(),
    phone: nullableTrimmedString(staffPhoneSchema),
    staffCode: nullableTrimmedString(staffCodeSchema),
    designation: nullableTrimmedString(designationSchema),
    gender: z.preprocess((value) => {
      if (typeof value !== 'string') {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }, genderSchema.nullable().optional()),
    dateOfBirth: nullableDateOfBirthSchema,
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one staff field is required',
  });

export type StaffGender = (typeof STAFF_GENDERS)[number];
export type StaffUserIdInput = z.infer<typeof staffUserIdSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  staffCode: string | null;
  designation: string | null;
  gender: StaffGender | null;
  dateOfBirth: string | null;
  isActive: boolean;
  createdOn: Date;
  modifiedOn: Date;
};

export type StaffListParams = {
  tenantId: string;
  query?: string;
  page?: number;
  limit?: number;
};
