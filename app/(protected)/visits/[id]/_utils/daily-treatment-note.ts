import { z } from 'zod';

export const dailyTreatmentFormSchema = z.object({
  actualMinutes: z
    .string()
    .refine(
      (value) => value === '' || (/^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 480),
      'Actual duration must be between 1 and 480 minutes.'
    ),
  response: z.string().trim().min(1, 'Treatment response is required.').max(5000),
  painScore: z
    .string()
    .refine(
      (value) => value === '' || (/^\d+$/.test(value) && Number(value) >= 0 && Number(value) <= 10),
      'Pain score must be between 0 and 10.'
    ),
  variations: z.string().trim().max(5000),
  adverseEvents: z.string().trim().max(5000),
});

export type DailyTreatmentFormValues = z.infer<typeof dailyTreatmentFormSchema>;

export function dailyTreatmentToSoap(
  values: DailyTreatmentFormValues,
  session: { label: string; procedure: string; sessionNumber: number }
) {
  return {
    subjective: `**Treatment response:**\n\n${values.response}${values.painScore ? `\n\nPain score: ${values.painScore}/10` : ''}`,
    objective: [
      `Session ${session.sessionNumber}: ${session.label} · ${session.procedure}`,
      values.actualMinutes ? `Actual duration: ${values.actualMinutes} minutes` : null,
      values.variations ? `**Variations:**\n\n${values.variations}` : null,
      values.adverseEvents ? `**Adverse events:**\n\n${values.adverseEvents}` : null,
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
}
