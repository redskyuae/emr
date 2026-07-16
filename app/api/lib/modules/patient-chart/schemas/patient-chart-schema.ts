import { z } from 'zod';

import type { ClinicalNote } from '../../clinical-note/schemas/clinical-note-schema';
import type { PatientAllergy } from '../../patient-allergy/schemas/patient-allergy-schema';
import type { PatientMedication } from '../../patient-medication/schemas/patient-medication-schema';
import type { PatientProblem } from '../../patient-problem/schemas/patient-problem-schema';
import type { PatientVitalSign } from '../../patient-vital-sign/schemas/patient-vital-sign-schema';

export const patientChartIdSchema = z.coerce
  .number({ error: 'Patient ID is required' })
  .int('Patient ID must be an integer')
  .positive('Patient ID must be positive');

export const patientChartTenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

export type PatientChart = {
  allergies: PatientAllergy[];
  problems: PatientProblem[];
  vitalSigns: PatientVitalSign[];
  medications: PatientMedication[];
  clinicalNotes: ClinicalNote[];
};
