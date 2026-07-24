import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { SavePatientIdentityDocumentRequest } from '../types';

export type GetPatientResponse = {
  data: Patient;
};

export type UpdatePatientRequest = {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  maritalStatus?: string;
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
  emiratesId?: string;
  identityDocuments?: SavePatientIdentityDocumentRequest[];
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
};

export type UpdatePatientResponse = {
  data: Patient;
};

export type DeletePatientResponse = void;
