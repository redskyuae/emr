import type { PatientRegistrationStatus } from '@/app/api/lib/modules/patient/schemas/patient-schema';

export type BookablePatient = {
  id: number;
  mrn: string;
  firstName: string;
  lastName: string;
  phone: string;
  emiratesId?: string | null;
  isActive: boolean;
  registrationStatus: PatientRegistrationStatus;
};
