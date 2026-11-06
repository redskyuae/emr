import type { DoctorConsultationFormValues } from './doctor-consultation-note';

type ConsultationField = keyof DoctorConsultationFormValues;

export type ConsultationSection = {
  id: string;
  title: string;
  fields: ConsultationField[];
};

const SECTIONS: (ConsultationSection & { ayurvedaOnly?: boolean })[] = [
  { id: 'consult-presenting', title: 'Presenting complaint', fields: ['chiefComplaint', 'hpi'] },
  {
    id: 'consult-history',
    title: 'History',
    fields: ['medicalHistory', 'surgicalHistory', 'familySocialHistory'],
  },
  {
    id: 'consult-examination',
    title: 'Examination and diagnosis',
    fields: ['examination', 'modernDiagnosis'],
  },
  {
    id: 'consult-ayurveda',
    title: 'Ayurvedic assessment',
    fields: ['prakriti', 'vikriti', 'ayurvedicDiagnosis'],
    ayurvedaOnly: true,
  },
  { id: 'consult-plan', title: 'Plan', fields: ['precautions'] },
];

export function consultationSections(showAyurveda: boolean): ConsultationSection[] {
  return SECTIONS.filter((section) => showAyurveda || !section.ayurvedaOnly);
}

export function filledFieldCount(
  section: ConsultationSection,
  values: Partial<DoctorConsultationFormValues>
) {
  return section.fields.filter((field) => values[field]?.trim()).length;
}
