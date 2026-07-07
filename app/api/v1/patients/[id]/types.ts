import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';

export type GetPatientResponse = {
  data: Patient;
};

export type UpdatePatientResponse = {
  data: Patient;
};

export type DeletePatientResponse = void;
