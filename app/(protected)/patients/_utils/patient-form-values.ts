import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { SavePatientRequest } from '@/app/api/v1/patients/types';

import {
  DEFAULT_PHONE_COUNTRY,
  getPhoneNumberError,
  joinPhoneNumber,
  splitPhoneNumber,
} from '@/lib/phone-numbers';

import {
  isUntouchedLegacyPhone,
  PHONE_FIELDS,
  type PatientFormValues,
} from './patient-form-schema';
import { formatEmiratesId, isRealEmiratesId, normaliseEmiratesId } from './patient-value-sets';

export const EMPTY_PATIENT_FORM_VALUES: PatientFormValues = {
  title: '',
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  maritalStatus: '',
  preferredPaymentMethod: '',
  phone: '',
  phoneCountry: DEFAULT_PHONE_COUNTRY,
  alternatePhone: '',
  alternatePhoneCountry: DEFAULT_PHONE_COUNTRY,
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateId: undefined,
  countryId: undefined,
  postalCode: '',
  nationalityId: undefined,
  languageId: undefined,
  religionId: undefined,
  race: '',
  ethnicGroup: '',
  hasEmiratesId: true,
  photoUrl: '',
  emiratesId: '',
  patientIdentificationCategory: '',
  passportNumber: '',
  uid: '',
  isVip: false,
  smsConsent: false,
  isMedicalTourist: false,
  identityDocuments: [],
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactGender: '',
  emergencyContactPhone: '',
  emergencyContactPhoneCountry: DEFAULT_PHONE_COUNTRY,
  legacyPhones: {},
};

// Phones are stored as +<country code><number>; the form edits the two parts
// separately. An untouched legacy phone goes back exactly as it was saved, and
// an empty optional phone is omitted.
function toStoredPhone(
  values: PatientFormValues,
  { name, countryName }: Pick<(typeof PHONE_FIELDS)[number], 'name' | 'countryName'>
) {
  const number = values[name];
  const country = values[countryName];
  const legacy = values.legacyPhones[name];

  if (!number) {
    return undefined;
  }

  return legacy !== undefined && isUntouchedLegacyPhone(legacy, country, number)
    ? legacy
    : joinPhoneNumber(country, number);
}

// Saved phones that fail today's country rule, e.g. 9876543210 saved for an
// Indian patient before country codes existed. A valid number in an old format
// (+91-9123456780) is not legacy: it is simply saved back as +919123456780.
function getLegacyPhones(patient: Patient): PatientFormValues['legacyPhones'] {
  return Object.fromEntries(
    PHONE_FIELDS.map(({ name }) => [name, patient[name]?.trim()]).filter(([, saved]) => {
      if (!saved) {
        return false;
      }

      const { country, number } = splitPhoneNumber(saved);
      return getPhoneNumberError(country, number) !== null;
    })
  );
}

export function patientToFormValues(patient: Patient): PatientFormValues {
  const phone = splitPhoneNumber(patient.phone);
  const alternatePhone = splitPhoneNumber(patient.alternatePhone ?? '');
  const emergencyContactPhone = splitPhoneNumber(patient.emergencyContactPhone ?? '');

  return {
    title: patient.title ?? '',
    firstName: patient.firstName,
    middleName: patient.middleName ?? '',
    lastName: patient.lastName,
    gender: patient.gender ?? '',
    dateOfBirth: patient.dateOfBirth ?? '',
    bloodGroup: patient.bloodGroup ?? '',
    maritalStatus: patient.maritalStatus ?? '',
    preferredPaymentMethod: patient.preferredPaymentMethod ?? '',
    phone: phone.number,
    phoneCountry: phone.country,
    alternatePhone: alternatePhone.number,
    alternatePhoneCountry: alternatePhone.country,
    email: patient.email ?? '',
    addressLine1: patient.addressLine1 ?? '',
    addressLine2: patient.addressLine2 ?? '',
    city: patient.city ?? '',
    stateId: patient.stateId ?? undefined,
    countryId: patient.countryId ?? undefined,
    postalCode: patient.postalCode ?? '',
    nationalityId: patient.nationalityId ?? undefined,
    languageId: patient.languageId ?? undefined,
    religionId: patient.religionId ?? undefined,
    race: patient.race ?? '',
    ethnicGroup: patient.ethnicGroup ?? '',
    hasEmiratesId: isRealEmiratesId(patient.emiratesId),
    photoUrl: patient.photoUrl ?? '',
    // Shown in the dashed form the card is printed with; normalised again on save.
    emiratesId: formatEmiratesId(patient.emiratesId) ?? '',
    patientIdentificationCategory: patient.patientIdentificationCategory ?? '',
    passportNumber: patient.passportNumber ?? '',
    uid: patient.uid ?? '',
    isVip: patient.isVip,
    smsConsent: patient.smsConsent,
    isMedicalTourist: patient.isMedicalTourist,
    // The id round-trips so the server can diff the replace rather than
    // tombstoning and reinserting unchanged documents (ADR 0043).
    identityDocuments: patient.identityDocuments.map((document) => ({
      id: document.id,
      documentType: document.documentType,
      documentNumber: document.documentNumber,
      issuingCountryId: document.issuingCountryId ?? undefined,
      expiryDate: document.expiryDate ?? '',
      label: document.label ?? '',
    })),
    emergencyContactName: patient.emergencyContactName ?? '',
    emergencyContactRelationship: patient.emergencyContactRelationship ?? '',
    emergencyContactGender: patient.emergencyContactGender ?? '',
    emergencyContactPhone: emergencyContactPhone.number,
    emergencyContactPhoneCountry: emergencyContactPhone.country,
    legacyPhones: getLegacyPhones(patient),
  };
}

export function patientFormValuesToRequest(values: PatientFormValues): SavePatientRequest {
  return {
    title: values.title,
    firstName: values.firstName,
    middleName: values.middleName || undefined,
    lastName: values.lastName,
    gender: values.gender,
    dateOfBirth: values.dateOfBirth,
    bloodGroup: values.bloodGroup || undefined,
    maritalStatus: values.maritalStatus || undefined,
    preferredPaymentMethod: values.preferredPaymentMethod || undefined,
    // Required, so the form never submits it empty.
    phone: toStoredPhone(values, { name: 'phone', countryName: 'phoneCountry' }) ?? '',
    alternatePhone: toStoredPhone(values, {
      name: 'alternatePhone',
      countryName: 'alternatePhoneCountry',
    }),
    email: values.email || undefined,
    addressLine1: values.addressLine1 || undefined,
    addressLine2: values.addressLine2 || undefined,
    city: values.city || undefined,
    stateId: values.stateId,
    countryId: values.countryId,
    postalCode: values.postalCode || undefined,
    nationalityId: values.nationalityId,
    languageId: values.languageId,
    religionId: values.religionId,
    race: values.race || undefined,
    ethnicGroup: values.ethnicGroup || undefined,
    emiratesId: values.emiratesId ? normaliseEmiratesId(values.emiratesId) : undefined,
    photoUrl: values.hasEmiratesId && values.photoUrl ? values.photoUrl : undefined,
    patientIdentificationCategory:
      !values.hasEmiratesId && values.patientIdentificationCategory
        ? values.patientIdentificationCategory
        : undefined,
    passportNumber: values.passportNumber || undefined,
    uid: values.uid || undefined,
    isVip: values.isVip,
    smsConsent: values.smsConsent,
    isMedicalTourist: values.isMedicalTourist,
    identityDocuments: values.identityDocuments.map((document) => ({
      id: document.id,
      documentType: document.documentType,
      documentNumber: document.documentNumber,
      // The API's discriminated union is .strict(), so fields that do not apply
      // to the chosen type must be omitted rather than sent as null.
      ...(document.issuingCountryId !== undefined && document.documentType !== 'residence-visa'
        ? { issuingCountryId: document.issuingCountryId }
        : {}),
      ...(document.expiryDate ? { expiryDate: document.expiryDate } : {}),
      ...(document.documentType === 'other' && document.label ? { label: document.label } : {}),
    })),
    emergencyContactName: values.emergencyContactName || undefined,
    emergencyContactRelationship: values.emergencyContactRelationship || undefined,
    emergencyContactGender: values.emergencyContactGender || undefined,
    emergencyContactPhone: toStoredPhone(values, {
      name: 'emergencyContactPhone',
      countryName: 'emergencyContactPhoneCountry',
    }),
  };
}
