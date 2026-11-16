import { z } from 'zod';

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .transform((value) => (value === '' ? undefined : value))
    .optional();

// Client-side mirror of the create/update Ayurveda Diagnosis Code contract.
// Code and name are required by both operations, so both carry an asterisk;
// the ICD-10-CM mapping is optional and null means "not mapped".
export const ayurvedaDiagnosisCodeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Ayurveda diagnosis name is required.', abort: true })
    .max(255, 'Ayurveda diagnosis name must be at most 255 characters.'),
  code: z
    .string()
    .trim()
    .min(1, { error: 'Ayurveda diagnosis code is required.', abort: true })
    .max(20, 'Ayurveda diagnosis code must be at most 20 characters.')
    .regex(
      /^[A-Za-z0-9.-]+$/,
      'Ayurveda diagnosis code must contain only letters, numbers, hyphens, and dots.'
    )
    .transform((code) => code.toUpperCase()),
  category: optionalText('Category', 100),
  englishName: optionalText('English name', 255),
  icdDiagnosisCodeId: z.number().int().positive().nullable(),
});

export type AyurvedaDiagnosisCodeFormValues = z.infer<typeof ayurvedaDiagnosisCodeFormSchema>;

type AyurvedaDiagnosisCodeField = keyof AyurvedaDiagnosisCodeFormValues;

// Maps an exact API error onto the form field it names, so the message can be
// shown inline as well as in the summary. Returns null for messages that do
// not name a single field.
export function getAyurvedaDiagnosisCodeErrorField(
  message: string
): AyurvedaDiagnosisCodeField | null {
  const normalized = message.toLowerCase();

  // The record itself is missing or its ID is bad: not a problem with any input.
  if (/^ayurveda diagnosis code (id\b|\d+ is invalid|not found)/.test(normalized)) {
    return null;
  }

  if (normalized.startsWith('ayurveda diagnosis code')) {
    return 'code';
  }

  if (
    normalized.startsWith('ayurveda diagnosis english name') ||
    normalized.startsWith('english name')
  ) {
    return 'englishName';
  }

  if (normalized.startsWith('ayurveda diagnosis name')) {
    return 'name';
  }

  if (normalized.startsWith('ayurveda diagnosis category') || normalized.startsWith('category')) {
    return 'category';
  }

  if (normalized.includes('icd') || normalized.startsWith('diagnosis code')) {
    return 'icdDiagnosisCodeId';
  }

  return null;
}
