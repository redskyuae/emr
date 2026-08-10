import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListPatientsResponse = Paginated<Patient>;

// The raw JSON a client may send for one Identity Document. `id` identifies an
// existing document to update; absent means a new one. Which of the remaining
// fields are required depends on `documentType` — see the discriminated union
// in patient-schema.ts and ADR 0043.
export type SavePatientIdentityDocumentRequest = {
  id?: number;
  documentType: string;
  documentNumber: string;
  issuingCountryId?: number;
  expiryDate?: string;
  label?: string;
};

export type SavePatientRequest = {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  maritalStatus?: string;
  preferredPaymentMethod?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateId?: number;
  countryId?: number;
  postalCode?: string;
  nationalityId?: number;
  languageId?: number;
  religionId?: number;
  race?: string;
  ethnicGroup?: string;
  emiratesId?: string;
  photoUrl?: string;
  patientIdentificationCategory?: string;
  uid?: string;
  isVip?: boolean;
  smsConsent?: boolean;
  isMedicalTourist?: boolean;
  identityDocuments?: SavePatientIdentityDocumentRequest[];
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactGender?: string;
  emergencyContactPhone?: string;
};

export type SavePatientResponse = {
  data: Patient;
};
