import { z } from 'zod';

import {
  VISIT_DIAGNOSIS_CODE_SYSTEMS,
  VISIT_DIAGNOSIS_TYPES,
} from '@/app/db/schema/visit-diagnosis';

export { VISIT_DIAGNOSIS_CODE_SYSTEMS, VISIT_DIAGNOSIS_TYPES };

const MAX_VISIT_DIAGNOSES = 20;

const positiveIdSchema = (label: string) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be an integer`)
    .positive(`${label} must be positive`);

const optionalIdSchema = (label: string) =>
  z
    .union([positiveIdSchema(label), z.null()])
    .optional()
    .transform((value) => value ?? null);

const notesSchema = z
  .union([z.string().trim().max(500, 'Diagnosis notes must be at most 500 characters'), z.null()])
  .optional()
  .transform((value) => (value === undefined || value === '' ? null : value));

const visitDiagnosisEntrySchema = z
  .object({
    codeSystem: z.enum(VISIT_DIAGNOSIS_CODE_SYSTEMS, {
      error: `Diagnosis code system must be one of ${VISIT_DIAGNOSIS_CODE_SYSTEMS.join(', ')}`,
    }),
    diagnosisCodeId: optionalIdSchema('Diagnosis code ID'),
    ayurvedaDiagnosisCodeId: optionalIdSchema('Ayurveda diagnosis code ID'),
    diagnosisType: z.enum(VISIT_DIAGNOSIS_TYPES, {
      error: `Diagnosis type must be one of ${VISIT_DIAGNOSIS_TYPES.join(', ')}`,
    }),
    notes: notesSchema,
  })
  .superRefine((entry, context) => {
    if (entry.codeSystem === 'ICD10CM' && entry.diagnosisCodeId === null) {
      context.addIssue({
        code: 'custom',
        path: ['diagnosisCodeId'],
        message: 'ICD-10-CM diagnoses need a Diagnosis Code.',
      });
    }

    if (entry.codeSystem === 'AYURVEDA' && entry.ayurvedaDiagnosisCodeId === null) {
      context.addIssue({
        code: 'custom',
        path: ['ayurvedaDiagnosisCodeId'],
        message: 'Ayurveda diagnoses need an Ayurveda Diagnosis Code.',
      });
    }
  })
  // Only the id that matches the code system is kept; the other is ignored.
  .transform((entry) => ({
    ...entry,
    diagnosisCodeId: entry.codeSystem === 'ICD10CM' ? entry.diagnosisCodeId : null,
    ayurvedaDiagnosisCodeId: entry.codeSystem === 'AYURVEDA' ? entry.ayurvedaDiagnosisCodeId : null,
  }));

const PRINCIPAL_RULES: Record<VisitDiagnosisCodeSystem, string> = {
  ICD10CM: 'Choose exactly one Principal ICD-10-CM diagnosis.',
  AYURVEDA: 'Choose exactly one Principal Ayurveda diagnosis.',
};

export const saveVisitDiagnosesSchema = z
  .object({
    diagnoses: z
      .array(visitDiagnosisEntrySchema, { error: 'Diagnoses must be a list' })
      .max(MAX_VISIT_DIAGNOSES, 'At most 20 diagnoses can be recorded on a Visit.'),
  })
  .superRefine(({ diagnoses }, context) => {
    for (const codeSystem of VISIT_DIAGNOSIS_CODE_SYSTEMS) {
      const entries = diagnoses.filter((entry) => entry.codeSystem === codeSystem);
      const principals = entries.filter((entry) => entry.diagnosisType === 'PRINCIPAL');

      if (entries.length > 0 && principals.length !== 1) {
        context.addIssue({
          code: 'custom',
          path: ['diagnoses'],
          message: PRINCIPAL_RULES[codeSystem],
        });
      }
    }
  });

export const visitDiagnosisVisitIdSchema = z.coerce
  .number({ error: 'Visit ID is required' })
  .int('Visit ID must be an integer')
  .positive('Visit ID must be positive');

export const visitDiagnosisTenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

export type VisitDiagnosisCodeSystem = (typeof VISIT_DIAGNOSIS_CODE_SYSTEMS)[number];
export type VisitDiagnosisType = (typeof VISIT_DIAGNOSIS_TYPES)[number];
export type SaveVisitDiagnosesInput = z.infer<typeof saveVisitDiagnosesSchema>;
export type VisitDiagnosisEntry = SaveVisitDiagnosesInput['diagnoses'][number];

export type VisitDiagnosis = {
  id: number;
  visitId: number;
  codeSystem: VisitDiagnosisCodeSystem;
  diagnosisType: VisitDiagnosisType;
  sortOrder: number;
  notes: string | null;
  // From the referenced master row, even if it was deleted after recording.
  code: string;
  // ICD-10-CM title, or the Ayurveda (Roga) name.
  title: string;
  englishName: string | null;
  diagnosisCodeId: number | null;
  ayurvedaDiagnosisCodeId: number | null;
  // The Ayurveda code's mapped ICD-10-CM code; null for ICD-10-CM rows.
  icdMapping: { id: number; code: string; title: string } | null;
};
