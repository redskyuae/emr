import { z } from 'zod';

const narrative = z.string().trim().max(5000, 'This section must be at most 5000 characters.');

// The API limit for one SOAP section. Five narrative fields share Subjective.
const SOAP_SECTION_LIMIT = 20000;

export const SOAP_SECTIONS = [
  { key: 'subjective', label: 'Subjective' },
  { key: 'objective', label: 'Objective' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'plan', label: 'Plan' },
] as const;

const consultationFieldsSchema = z.object({
  noteTypeId: z.string().min(1, 'Note type is required.'),
  chiefComplaint: narrative.min(1, 'Chief complaint is required.'),
  hpi: narrative,
  medicalHistory: narrative,
  surgicalHistory: narrative,
  familySocialHistory: narrative,
  examination: narrative,
  modernDiagnosis: z.string().trim(),
  ayurvedicDiagnosis: narrative,
  prakriti: narrative,
  vikriti: narrative,
  precautions: narrative,
});

export type DoctorConsultationFormValues = z.infer<typeof consultationFieldsSchema>;

export const EMPTY_CONSULTATION: DoctorConsultationFormValues = {
  hpi: '',
  vikriti: '',
  prakriti: '',
  noteTypeId: '',
  examination: '',
  precautions: '',
  chiefComplaint: '',
  medicalHistory: '',
  modernDiagnosis: '',
  surgicalHistory: '',
  ayurvedicDiagnosis: '',
  familySocialHistory: '',
};

type NarrativeField = Exclude<keyof DoctorConsultationFormValues, 'modernDiagnosis' | 'noteTypeId'>;

const SUBJECTIVE_LABELS: [NarrativeField, string][] = [
  ['chiefComplaint', 'Chief complaint'],
  ['hpi', 'Present condition / HPI'],
  ['medicalHistory', 'Past medical history'],
  ['surgicalHistory', 'Past surgical history'],
  ['familySocialHistory', 'Family / social history'],
];

const OBJECTIVE_LABELS: [NarrativeField, string][] = [
  ['examination', 'Examination / red flags'],
  ['prakriti', 'Prakriti'],
  ['vikriti', 'Vikriti / body condition'],
];

const ASSESSMENT_LABELS: [NarrativeField, string][] = [
  ['ayurvedicDiagnosis', 'Ayurvedic diagnosis'],
];

const PLAN_LABELS: [NarrativeField, string][] = [['precautions', 'Treatment precautions']];

const MODERN_DIAGNOSIS_PREFIX = 'Modern diagnosis: ';

function labelled(label: string, value: string) {
  return value ? `**${label}:**\n\n${value}` : null;
}

function labelledSections(
  values: DoctorConsultationFormValues,
  labels: [NarrativeField, string][]
) {
  return labels.map(([field, label]) => labelled(label, values[field]));
}

function joinSections(sections: (string | null)[]) {
  return sections.filter(Boolean).join('\n\n');
}

export function consultationToSoap(values: DoctorConsultationFormValues) {
  return {
    subjective: joinSections(labelledSections(values, SUBJECTIVE_LABELS)),
    objective: joinSections(labelledSections(values, OBJECTIVE_LABELS)) || undefined,
    assessment:
      joinSections([
        values.modernDiagnosis ? `${MODERN_DIAGNOSIS_PREFIX}${values.modernDiagnosis}` : null,
        ...labelledSections(values, ASSESSMENT_LABELS),
      ]) || undefined,
    plan: joinSections(labelledSections(values, PLAN_LABELS)) || undefined,
  };
}

export const doctorConsultationFormSchema = consultationFieldsSchema.superRefine(
  (values, context) => {
    if (consultationToSoap(values).subjective.length <= SOAP_SECTION_LIMIT) return;

    const [longest] = SUBJECTIVE_LABELS.map(([field]) => field).sort(
      (a, b) => values[b].length - values[a].length
    );

    context.addIssue({
      code: 'custom',
      path: [longest],
      message: `Complaint and history together must be at most ${SOAP_SECTION_LIMIT} characters.`,
    });
  }
);

function readLabelled(
  section: string,
  labels: [NarrativeField, string][],
  values: DoctorConsultationFormValues
) {
  const markers = labels
    .map(([field, label]) => ({
      field,
      marker: `**${label}:**\n\n`,
      index: section.indexOf(`**${label}:**\n\n`),
    }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index);

  markers.forEach((item, position) => {
    const end = markers[position + 1]?.index ?? section.length;
    values[item.field] = section.slice(item.index + item.marker.length, end).trim();
  });
}

type ConsultationNoteSections = {
  noteTypeId: number;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
};

/**
 * Rebuilds the form from a saved draft so the Doctor resumes it instead of
 * creating a second note. Returns null when the note was written outside this
 * form: re-saving it through the form would drop text the labels cannot hold.
 */
export function soapToConsultation(
  note: ConsultationNoteSections
): DoctorConsultationFormValues | null {
  const values = { ...EMPTY_CONSULTATION, noteTypeId: String(note.noteTypeId) };
  const assessment = note.assessment ?? '';

  readLabelled(note.subjective ?? '', SUBJECTIVE_LABELS, values);
  readLabelled(note.objective ?? '', OBJECTIVE_LABELS, values);
  readLabelled(assessment, ASSESSMENT_LABELS, values);
  readLabelled(note.plan ?? '', PLAN_LABELS, values);

  if (assessment.startsWith(MODERN_DIAGNOSIS_PREFIX)) {
    values.modernDiagnosis = assessment
      .slice(MODERN_DIAGNOSIS_PREFIX.length)
      .split('\n\n')[0]
      .trim();
  }

  const rebuilt = consultationToSoap(values);
  const matches =
    rebuilt.subjective === (note.subjective ?? '') &&
    (rebuilt.objective ?? '') === (note.objective ?? '') &&
    (rebuilt.assessment ?? '') === assessment &&
    (rebuilt.plan ?? '') === (note.plan ?? '');

  return matches ? values : null;
}
