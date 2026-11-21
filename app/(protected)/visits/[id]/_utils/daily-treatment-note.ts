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

/**
 * The `**Label:**` headings this sheet writes into a note. The Visit Summary reads notes back by
 * these labels and patterns, so change them here, never in a copy.
 */
export const DAILY_TREATMENT_LABELS = {
  response: 'Treatment response',
  variations: 'Variations',
  adverseEvents: 'Adverse events',
} as const;

// Pain score is appended to the response; actual duration is a plain line in Objective.
export const PAIN_SCORE_PATTERN = /\n*Pain score: (\d+)\/10$/;
export const ACTUAL_DURATION_PATTERN = /Actual duration: (\d+) minutes/;

export function dailyTreatmentToSoap(
  values: DailyTreatmentFormValues,
  session: { label: string; procedure: string; sessionNumber: number }
) {
  return {
    subjective: `**${DAILY_TREATMENT_LABELS.response}:**\n\n${values.response}${values.painScore ? `\n\nPain score: ${values.painScore}/10` : ''}`,
    objective: [
      `Session ${session.sessionNumber}: ${session.label} · ${session.procedure}`,
      values.actualMinutes ? `Actual duration: ${values.actualMinutes} minutes` : null,
      values.variations
        ? `**${DAILY_TREATMENT_LABELS.variations}:**\n\n${values.variations}`
        : null,
      values.adverseEvents
        ? `**${DAILY_TREATMENT_LABELS.adverseEvents}:**\n\n${values.adverseEvents}`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
}
