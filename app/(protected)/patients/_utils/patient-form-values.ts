import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { SavePatientRequest } from '@/app/api/v1/patients/types';

import type { PatientFormValues } from './patient-form-schema';
import { formatEmiratesId, normaliseEmiratesId } from './patient-value-sets';

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
  alternatePhone: '',
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
};

export function patientToFormValues(patient: Patient): PatientFormValues {
  return {
    title: '',
    firstName: patient.firstName,
    middleName: patient.middleName ?? '',
    lastName: patient.lastName,
    gender: patient.gender ?? '',
    dateOfBirth: patient.dateOfBirth ?? '',
    bloodGroup: patient.bloodGroup ?? '',
    maritalStatus: patient.maritalStatus ?? '',
    preferredPaymentMethod: patient.preferredPaymentMethod ?? '',
    phone: patient.phone,
    alternatePhone: patient.alternatePhone ?? '',
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
    hasEmiratesId: Boolean(patient.emiratesId),
    photoUrl: patient.photoUrl ?? '',
    // Shown in the dashed form the card is printed with; normalised again on save.
    emiratesId: formatEmiratesId(patient.emiratesId) ?? '',
    patientIdentificationCategory: patient.patientIdentificationCategory ?? '',
    passportNumber: '',
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
    emergencyContactPhone: patient.emergencyContactPhone ?? '',
  };
}

export function patientFormValuesToRequest(values: PatientFormValues): SavePatientRequest {
  return {
    firstName: values.firstName,
    middleName: values.middleName || undefined,
    lastName: values.lastName,
    gender: values.gender,
    dateOfBirth: values.dateOfBirth,
    bloodGroup: values.bloodGroup || undefined,
    maritalStatus: values.maritalStatus || undefined,
    preferredPaymentMethod: values.preferredPaymentMethod || undefined,
    phone: values.phone,
    alternatePhone: values.alternatePhone || undefined,
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
    emiratesId:
      values.hasEmiratesId && values.emiratesId
        ? normaliseEmiratesId(values.emiratesId)
        : undefined,
    photoUrl: values.hasEmiratesId && values.photoUrl ? values.photoUrl : undefined,
    patientIdentificationCategory:
      !values.hasEmiratesId && values.patientIdentificationCategory
        ? values.patientIdentificationCategory
        : undefined,
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
    emergencyContactPhone: values.emergencyContactPhone || undefined,
  };
}
