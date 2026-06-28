import { z } from 'zod';

// Mirrors the StaffGender enum in the API contract (createStaffSchema).
export const STAFF_GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

const nameField = z
  .string()
  .trim()
  .min(1, 'Name is required.')
  .max(100, 'Name must be at most 100 characters.');

const phoneField = z.string().trim();
const staffCodeField = z.string().trim().max(20, 'Staff code must be at most 20 characters.');
const designationField = z.string().trim().max(100, 'Designation must be at most 100 characters.');
const genderField = z.enum(STAFF_GENDER_OPTIONS).or(z.literal(''));
const dateOfBirthField = z.string().trim();

// Create contract (SaveStaffRequest): name, email, password, roleIds are required.
export const staffCreateFormSchema = z.object({
  name: nameField,
  email: z.string().trim().min(1, 'Email is required.').email('Email must be valid.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password must be at most 128 characters.'),
  roleIds: z.array(z.number()).min(1, 'Select at least one Role.'),
  phone: phoneField,
  staffCode: staffCodeField,
  designation: designationField,
  gender: genderField,
  dateOfBirth: dateOfBirthField,
});

// Edit contract (UpdateStaffRequest): profile fields only. Email and password are
// not editable through this endpoint; Roles are managed via the granular endpoints.
// `name` is optional here to mirror UpdateStaffRequest (and the no-asterisk UI) —
// the server still rejects an empty string, so the sheet omits a blank name.
export const staffEditFormSchema = z.object({
  name: z.string().trim().max(100, 'Name must be at most 100 characters.').optional(),
  phone: phoneField,
  staffCode: staffCodeField,
  designation: designationField,
  gender: genderField,
  dateOfBirth: dateOfBirthField,
});

export type StaffCreateFormValues = z.infer<typeof staffCreateFormSchema>;
export type StaffEditFormValues = z.infer<typeof staffEditFormSchema>;
