import { z } from 'zod';

const optionalNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        (!Number.isNaN(Number(value)) && Number(value) >= min && Number(value) <= max),
      `${label} must be between ${min} and ${max}.`
    );

// BMI is intentionally absent: the server computes it from height and weight.
export const admissionVitalsFormSchema = z.object({
  heightCm: optionalNumber('Height', 0, 300),
  weightKg: optionalNumber('Weight', 0, 700),
  systolic: optionalNumber('Systolic', 0, 400),
  diastolic: optionalNumber('Diastolic', 0, 400),
  pulseBpm: optionalNumber('Pulse', 0, 400),
  respRate: optionalNumber('Respiratory rate', 0, 200),
  temperatureC: optionalNumber('Temperature', 20, 45),
  spo2: optionalNumber('SpO₂', 0, 100),
  painScore: optionalNumber('Pain score', 0, 10),
  notes: z.string().trim(),
});

export const admissionNoteFormSchema = z
  .object({
    noteTypeId: z.string().min(1, 'Note type is required.'),
    subjective: z.string().trim(),
    objective: z.string().trim(),
    assessment: z.string().trim(),
    plan: z.string().trim(),
  })
  .refine(
    (data) =>
      [data.subjective, data.objective, data.assessment, data.plan].some(
        (section) => section.length > 0
      ),
    { message: 'Complete at least one SOAP section.', path: ['subjective'] }
  );

export type AdmissionVitalsFormValues = z.infer<typeof admissionVitalsFormSchema>;
export type AdmissionNoteFormValues = z.infer<typeof admissionNoteFormSchema>;

/** Blank inputs must be omitted, not sent as 0 — the API treats 0 as a reading. */
export function toOptionalNumber(value: string) {
  return value.trim() === '' ? undefined : Number(value);
}
