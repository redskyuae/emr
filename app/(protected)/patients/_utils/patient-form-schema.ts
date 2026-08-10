import { z } from 'zod';

import {
  normaliseEmiratesId,
  PATIENT_BLOOD_GROUPS,
  PATIENT_GENDERS,
  PATIENT_IDENTITY_DOCUMENT_TYPES,
  PATIENT_IDENTIFICATION_CATEGORIES,
  PATIENT_MARITAL_STATUSES,
  PATIENT_PAYMENT_METHODS,
  PATIENT_TITLES,
  PATIENT_ETHNIC_GROUPS,
  PATIENT_RACES,
} from './patient-value-sets';

function isNotFutureDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date <= today;
}

function isPatientPhotoUrl(value: string) {
  if (/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
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

// Flat rather than a discriminated union: useFieldArray needs a stable row
// shape as the user switches type mid-edit. The per-type rules the API enforces
// through its discriminated union are mirrored in the superRefine below.
const identityDocumentFormSchema = z.object({
  id: z.number().int().positive().optional(),
  documentType: z.enum(PATIENT_IDENTITY_DOCUMENT_TYPES),
  documentNumber: z
    .string()
    .trim()
    .min(1, 'Document number is required.')
    .max(50, 'Document number must be at most 50 characters.'),
  issuingCountryId: z.number().int().positive().optional(),
  expiryDate: z.string().trim().optional().or(z.literal('')),
  label: optionalNameField('Label', 100),
});

// Mirrors the API contract exactly; the form's asterisks are driven from here.
const IDENTITY_DOCUMENT_REQUIRED_FIELDS: Record<
  (typeof PATIENT_IDENTITY_DOCUMENT_TYPES)[number],
  { issuingCountryId: boolean; expiryDate: boolean }
> = {
  passport: { issuingCountryId: true, expiryDate: true },
  'national-id': { issuingCountryId: true, expiryDate: false },
  'residence-visa': { issuingCountryId: false, expiryDate: true },
  'driving-license': { issuingCountryId: false, expiryDate: false },
  other: { issuingCountryId: false, expiryDate: false },
};

export function getIdentityDocumentRequiredFields(documentType: string) {
  return (
    IDENTITY_DOCUMENT_REQUIRED_FIELDS[
      documentType as (typeof PATIENT_IDENTITY_DOCUMENT_TYPES)[number]
    ] ?? { issuingCountryId: false, expiryDate: false }
  );
}

export const patientFormSchema = z
  .object({
    title: z.enum(PATIENT_TITLES).or(z.literal('')),
    firstName: requiredNameField('First name'),
    middleName: optionalNameField('Middle name', 100),
    lastName: requiredNameField('Last name'),
    gender: z.enum(PATIENT_GENDERS).or(z.literal('')),
    dateOfBirth: z
      .string()
      .trim()
      .min(1, 'Date of birth is required.')
      .refine(isNotFutureDate, 'Date of birth must not be in the future.'),
    bloodGroup: z.enum(PATIENT_BLOOD_GROUPS).optional().or(z.literal('')),
    maritalStatus: z.enum(PATIENT_MARITAL_STATUSES).optional().or(z.literal('')),
    preferredPaymentMethod: z.enum(PATIENT_PAYMENT_METHODS).optional().or(z.literal('')),
    phone: requiredPhoneField('Phone'),
    alternatePhone: optionalPhoneField('Alternate phone'),
    email: z
      .email('Email must be valid.')
      .trim()
      .max(255, 'Email must be at most 255 characters.')
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
    race: z.enum(PATIENT_RACES).optional().or(z.literal('')),
    ethnicGroup: z.enum(PATIENT_ETHNIC_GROUPS).optional().or(z.literal('')),
    hasEmiratesId: z.boolean(),
    photoUrl: z
      .string()
      .trim()
      .max(1_500_000, 'Patient photo must be at most 1.5MB.')
      .refine(
        (value) => value === '' || isPatientPhotoUrl(value),
        'Patient photo must be an HTTP(S) URL or image data URL from Emirates ID read.'
      )
      .optional()
      .or(z.literal('')),
    emiratesId: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^784\d{12}$/.test(normaliseEmiratesId(value)),
        'Emirates ID must be 15 digits beginning with 784.'
      )
      .optional()
      .or(z.literal('')),
    patientIdentificationCategory: z
      .enum(PATIENT_IDENTIFICATION_CATEGORIES)
      .optional()
      .or(z.literal('')),
    passportNumber: optionalNameField('Passport number', 50),
    uid: optionalNameField('UID', 30),
    isVip: z.boolean(),
    smsConsent: z.boolean(),
    isMedicalTourist: z.boolean(),
    identityDocuments: z.array(identityDocumentFormSchema),
    emergencyContactName: optionalNameField('Next of Kin', 150),
    emergencyContactRelationship: optionalNameField('Next of Kin Relationship', 50),
    emergencyContactGender: z.enum(PATIENT_GENDERS).optional().or(z.literal('')),
    emergencyContactPhone: optionalPhoneField('Next of Kin Phone'),
  })
  .superRefine((data, ctx) => {
    if (data.gender === '') {
      ctx.addIssue({ code: 'custom', message: 'Gender is required.', path: ['gender'] });
    }

    if (data.hasEmiratesId && !data.emiratesId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Emirates ID is required.',
        path: ['emiratesId'],
      });
    }

    if (!data.hasEmiratesId && !data.patientIdentificationCategory) {
      ctx.addIssue({
        code: 'custom',
        message: 'Patient Identification Category is required.',
        path: ['patientIdentificationCategory'],
      });
    }

    if (!data.hasEmiratesId && data.photoUrl) {
      ctx.addIssue({
        code: 'custom',
        message: 'Patient photo can only be saved with Emirates ID.',
        path: ['photoUrl'],
      });
    }

    if (data.isMedicalTourist && data.hasEmiratesId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Medical Tourist cannot have Emirates ID.',
        path: ['hasEmiratesId'],
      });
    }

    if (data.isMedicalTourist && !data.uid) {
      ctx.addIssue({
        code: 'custom',
        message: 'UID is required for Medical Tourist.',
        path: ['uid'],
      });
    }

    data.identityDocuments.forEach((document, index) => {
      const required = getIdentityDocumentRequiredFields(document.documentType);

      if (required.issuingCountryId && document.issuingCountryId === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'Issuing country is required for this document type.',
          path: ['identityDocuments', index, 'issuingCountryId'],
        });
      }

      if (required.expiryDate && !document.expiryDate) {
        ctx.addIssue({
          code: 'custom',
          message: 'Expiry date is required for this document type.',
          path: ['identityDocuments', index, 'expiryDate'],
        });
      }

      // A residence visa is always issued by the UAE, so the API rejects an
      // issuing country outright rather than ignoring it.
      if (document.documentType === 'residence-visa' && document.issuingCountryId !== undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'A residence visa is always issued by the UAE.',
          path: ['identityDocuments', index, 'issuingCountryId'],
        });
      }
    });

    if (data.stateId !== undefined && data.countryId === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Country is required when State is provided.',
        path: ['countryId'],
      });
    }
  });

export type PatientFormValues = z.infer<typeof patientFormSchema>;
