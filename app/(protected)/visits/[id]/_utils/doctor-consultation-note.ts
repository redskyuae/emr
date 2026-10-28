import { z } from 'zod';

const narrative = z.string().trim().max(5000, 'This section must be at most 5000 characters.');

export const doctorConsultationFormSchema = z.object({
  chiefComplaint: narrative.min(1, 'Chief complaint is required.'),
  hpi: narrative,
  medicalHistory: narrative,
  surgicalHistory: narrative,
  familySocialHistory: narrative,
  examination: narrative,
  diagnosisCodeId: z.string(),
  ayurvedicDiagnosis: narrative,
  prakriti: narrative,
  vikriti: narrative,
  precautions: narrative,
});

export type DoctorConsultationFormValues = z.infer<typeof doctorConsultationFormSchema>;

function labelled(label: string, value: string) {
  return value ? `**${label}:**\n\n${value}` : null;
}

export function consultationToSoap(
  values: DoctorConsultationFormValues,
  modernDiagnosis?: { code: string; title: string }
) {
  return {
    subjective: [
      labelled('Chief complaint', values.chiefComplaint),
      labelled('Present condition / HPI', values.hpi),
      labelled('Past medical history', values.medicalHistory),
      labelled('Past surgical history', values.surgicalHistory),
      labelled('Family / social history', values.familySocialHistory),
    ]
      .filter(Boolean)
      .join('\n\n'),
    objective:
      [
        labelled('Examination / red flags', values.examination),
        labelled('Prakriti', values.prakriti),
        labelled('Vikriti / body condition', values.vikriti),
      ]
        .filter(Boolean)
        .join('\n\n') || undefined,
    assessment:
      [
        modernDiagnosis
          ? `Modern diagnosis: ${modernDiagnosis.code} — ${modernDiagnosis.title}`
          : null,
        labelled('Ayurvedic diagnosis', values.ayurvedicDiagnosis),
      ]
        .filter(Boolean)
        .join('\n\n') || undefined,
    plan: labelled('Treatment precautions', values.precautions) ?? undefined,
  };
}
