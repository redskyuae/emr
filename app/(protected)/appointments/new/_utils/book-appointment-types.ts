import type { PatientRegistrationStatus } from '@/app/api/lib/modules/patient/schemas/patient-schema';

export type BookingPath = 'CONSULTATION' | 'PROCEDURE';

export const PROCEDURE_SELECTION_MODE_VALUES = ['EXISTING_PLAN', 'CATALOGUE'] as const;
export type ProcedureSelectionMode = (typeof PROCEDURE_SELECTION_MODE_VALUES)[number];

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
