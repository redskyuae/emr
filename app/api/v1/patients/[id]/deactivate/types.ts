import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';

export type DeactivatePatientResponse = {
  data: Patient;
};
