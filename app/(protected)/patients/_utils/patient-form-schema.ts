import { z } from 'zod';

import {
  PATIENT_BLOOD_GROUPS,
  PATIENT_GENDERS,
  PATIENT_GOVT_ID_TYPES,
  PATIENT_MARITAL_STATUSES,
} from './patient-value-sets';

function isNotFutureDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date <= today;
}

const requiredNameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(100, `${label} must be at most 100 characters.`);

const optionalNameField = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .optional()
    .or(z.literal(''));

const requiredPhoneField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(20, `${label} must be at most 20 characters.`);

const optionalPhoneField = (label: string) =>
  z.string().trim().max(20, `${label} must be at most 20 characters.`).optional().or(z.literal(''));

export const patientFormSchema = z
  .object({
    firstName: requiredNameField('First name'),
    middleName: optionalNameField('Middle name', 100),
    lastName: requiredNameField('Last name'),
    gender: z.enum(PATIENT_GENDERS, { error: 'Gender is required.' }).or(z.literal('')),
    dateOfBirth: z
      .string()
      .trim()
      .min(1, 'Date of birth is required.')
      .refine(isNotFutureDate, 'Date of birth must not be in the future.'),
    bloodGroup: z.enum(PATIENT_BLOOD_GROUPS).optional().or(z.literal('')),
    maritalStatus: z.enum(PATIENT_MARITAL_STATUSES).optional().or(z.literal('')),
    phone: requiredPhoneField('Phone'),
    alternatePhone: optionalPhoneField('Alternate phone'),
    email: z
      .string()
      .trim()
      .max(255, 'Email must be at most 255 characters.')
      .email('Email must be valid.')
      .optional()
      .or(z.literal('')),
    addressLine1: optionalNameField('Address line 1', 255),
    addressLine2: optionalNameField('Address line 2', 255),
    city: optionalNameField('City', 100),
    stateId: z.number().int().positive().optional(),
    countryId: z.number().int().positive().optional(),
    postalCode: optionalNameField('Postal code', 20),
    nationalityId: z.number().int().positive().optional(),
    languageId: z.number().int().positive().optional(),
    religionId: z.number().int().positive().optional(),
    govtIdType: z.enum(PATIENT_GOVT_ID_TYPES).optional().or(z.literal('')),
    govtIdNumber: optionalNameField('Government ID number', 50),
    emergencyContactName: optionalNameField('Emergency contact name', 150),
    emergencyContactRelationship: optionalNameField('Emergency contact relationship', 50),
    emergencyContactPhone: optionalPhoneField('Emergency contact phone'),
  })
  .superRefine((data, ctx) => {
    if (data.gender === '') {
      ctx.addIssue({ code: 'custom', message: 'Gender is required.', path: ['gender'] });
    }

    if (Boolean(data.govtIdType) !== Boolean(data.govtIdNumber)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Government ID type and number must be provided together.',
        path: ['govtIdNumber'],
      });
    }

    if (data.stateId !== undefined && data.countryId === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Country is required when State is provided.',
        path: ['countryId'],
      });
    }
  });

export type PatientFormValues = z.infer<typeof patientFormSchema>;
