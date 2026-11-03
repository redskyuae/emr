import { z } from 'zod';

const PHONE_PATTERN = /^\d{10}$/;

export const activityFormSchema = z
  .object({
    type: z.enum(['camp', 'event', 'visit']),
    status: z.enum(['planned', 'completed']),
    title: z
      .string()
      .trim()
      .min(1, 'Title is required.')
      .max(160, 'Title must be at most 160 characters.'),
    date: z.string().min(1, 'Date is required.'),
    startTime: z.string(),
    endTime: z.string(),
    venue: z.string().trim().max(160, 'Must be at most 160 characters.'),
    area: z.string().trim().min(1, 'Area is required.').max(120),
    address: z.string().trim().max(240, 'Address must be at most 240 characters.'),
    person: z.string().trim().max(120),
    personPhone: z.string().trim(),
    familyPresent: z.string().trim().max(120),
    requestedBy: z.string(),
    staffIds: z.array(z.string()).min(1, 'Assign at least one staff member.'),
    leadId: z.string(),
    reason: z.string().trim().max(500, 'Reason must be at most 500 characters.'),
    speaker: z.string(),
    audience: z.string(),
    language: z.string(),
    expectedAudience: z.string().trim(),
    organiser: z.string().trim().max(160),
    duration: z.string(),
    offers: z.array(z.string()),
    notes: z.string().trim().max(1000, 'Notes must be at most 1000 characters.'),
    outcome: z.enum(['interested', 'booked', 'patient', 'notint', 'away']),
    nextDate: z.string(),
    nextBy: z.string(),
    visitNotes: z.string().trim().max(1000, 'Visit notes must be at most 1000 characters.'),
    reached: z.string().trim(),
    attachments: z.array(z.object({ name: z.string(), size: z.number() })),
    summary: z.string().trim().max(1000, 'Summary must be at most 1000 characters.'),
  })
  .superRefine((values, context) => {
    const fail = (path: keyof ActivityFormValues, message: string) =>
      context.addIssue({ code: 'custom', path: [path], message });

    if (values.venue === '') {
      fail(
        'venue',
        values.type === 'visit' ? 'House name or number is required.' : 'Venue is required.'
      );
    }

    if (values.startTime && values.endTime && values.endTime <= values.startTime) {
      fail('endTime', 'End time must be after the start time.');
    }

    if (values.expectedAudience && !/^\d+$/.test(values.expectedAudience)) {
      fail('expectedAudience', 'Enter a whole number.');
    }

    if (values.reached && !/^\d+$/.test(values.reached)) {
      fail('reached', 'Enter a whole number.');
    }

    if (values.type !== 'visit') {
      return;
    }

    if (values.person === '') {
      fail('person', 'Person to meet is required.');
    }

    if (!PHONE_PATTERN.test(values.personPhone.replace(/\D/g, ''))) {
      fail('personPhone', 'Enter a 10-digit mobile number.');
    }

    if (values.reason === '') {
      fail('reason', 'Reason for the visit is required.');
    }
  });

export type ActivityFormValues = z.infer<typeof activityFormSchema>;
