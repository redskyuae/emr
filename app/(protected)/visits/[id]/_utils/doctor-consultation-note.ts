import { z } from 'zod';

const narrative = z.string().trim().max(5000, 'This section must be at most 5000 characters.');

const diagnosisCodeOption = z
  .object({ id: z.number().optional(), code: z.string(), title: z.string() })
  .nullable();

export const doctorConsultationFormSchema = z.object({
  chiefComplaint: narrative.min(1, 'Chief complaint is required.'),
  hpi: narrative,
  medicalHistory: narrative,
  surgicalHistory: narrative,
  familySocialHistory: narrative,
  examination: narrative,
  diagnosisCode: diagnosisCodeOption,
  ayurvedaDiagnosisCode: diagnosisCodeOption,
  ayurvedicDiagnosis: narrative,
  prakriti: narrative,
  vikriti: narrative,
  precautions: narrative,
});

export type DoctorConsultationFormValues = z.infer<typeof doctorConsultationFormSchema>;

function labelled(label: string, value: string) {
  return value ? `**${label}:**\n\n${value}` : null;
}

export function consultationToSoap(values: DoctorConsultationFormValues) {
  const { diagnosisCode, ayurvedaDiagnosisCode } = values;

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
        diagnosisCode ? `Diagnosis Code: ${diagnosisCode.code} — ${diagnosisCode.title}` : null,
        ayurvedaDiagnosisCode
          ? `Ayurveda Diagnosis Code: ${ayurvedaDiagnosisCode.code} — ${ayurvedaDiagnosisCode.title}`
          : null,
        labelled('Ayurvedic diagnosis', values.ayurvedicDiagnosis),
      ]
        .filter(Boolean)
        .join('\n\n') || undefined,
    plan: labelled('Treatment precautions', values.precautions) ?? undefined,
  };
}
