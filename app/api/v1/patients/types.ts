import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListPatientsResponse = Paginated<Patient>;

export type SavePatientRequest = {
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
  govtIdType?: string;
  govtIdNumber?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
};

export type SavePatientResponse = {
  data: Patient;
};
