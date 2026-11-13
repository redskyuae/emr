import type { DoctorConsultationFormValues } from './doctor-consultation-note';

type ConsultationField = keyof DoctorConsultationFormValues;

export const CONSULTATION_STEP_IDS = [
  'subjective',
  'objective',
  'assessment',
  'plan',
  'review',
] as const;

export type ConsultationStepId = (typeof CONSULTATION_STEP_IDS)[number];

export type ConsultationStep = {
  id: ConsultationStepId;
  title: string;
  description: string;
  fields: ConsultationField[];
};

const STEPS: (ConsultationStep & { ayurvedaFields?: ConsultationField[] })[] = [
  {
    id: 'subjective',
    title: 'Subjective',
    description: 'What the Patient tells you: the complaint and their history.',
    fields: ['chiefComplaint', 'hpi', 'medicalHistory', 'surgicalHistory', 'familySocialHistory'],
  },
  {
    id: 'objective',
    title: 'Objective',
    description: 'Vital Signs for this Visit and what you find on examination.',
    fields: ['examination'],
    ayurvedaFields: ['prakriti', 'vikriti'],
  },
  {
    id: 'assessment',
    title: 'Assessment',
    description: 'The working diagnosis for this Visit.',
    fields: ['modernDiagnosis'],
    ayurvedaFields: ['ayurvedicDiagnosis'],
  },
  {
    id: 'plan',
    title: 'Plan & Session',
    description: 'Precautions for the care team, and the Treatment Session for today.',
    fields: ['precautions'],
  },
  {
    id: 'review',
    title: 'Review & complete',
    description:
      'Clinical Notes, Billing and Documents for this Visit. Open items warn but do not block.',
    fields: [],
  },
];

export function consultationSteps(showAyurveda: boolean): ConsultationStep[] {
  return STEPS.map(({ ayurvedaFields, ...step }) => ({
    ...step,
    fields: showAyurveda && ayurvedaFields ? [...step.fields, ...ayurvedaFields] : step.fields,
  }));
}

/** The step that holds a field, so a failed save can open the step with the error. */
export function stepForField(
  field: string,
  steps: ConsultationStep[]
): ConsultationStepId | undefined {
  if (field === 'noteTypeId') return 'subjective';

  return steps.find((step) => step.fields.some((name) => name === field))?.id;
}

export function filledFieldCount(
  step: ConsultationStep,
  values: Partial<DoctorConsultationFormValues>
) {
  return step.fields.filter((field) => values[field]?.trim()).length;
}
