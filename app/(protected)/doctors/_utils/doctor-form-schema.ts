import { z } from 'zod';

const DOCTOR_GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;
const DATE_OF_BIRTH_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const doctorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be at most 100 characters.'),
  email: z.string().trim().email('Email must be valid.').or(z.literal('')),
  password: z.string(),
  specialtyId: z
    .string()
    .trim()
    .min(1, 'Specialty is required.')
    .refine((value) => /^\d+$/.test(value), 'Specialty is required.'),
  gender: z.enum(DOCTOR_GENDERS).or(z.literal('')),
  dateOfBirth: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || DATE_OF_BIRTH_PATTERN.test(value),
      'Date of birth must be a valid date.'
    ),
  staffCode: z.string().trim().max(20, 'Staff code must be at most 20 characters.'),
  designation: z.string().trim().max(100, 'Designation must be at most 100 characters.'),
  qualifications: z.string().trim(),
  registrationNumber: z
    .string()
    .trim()
    .max(100, 'Doctor registration number must be at most 100 characters.'),
});

export type DoctorFormValues = z.infer<typeof doctorFormSchema>;

export const DOCTOR_GENDER_OPTIONS = DOCTOR_GENDERS.map((gender) => ({
  value: gender,
  label: gender,
}));
