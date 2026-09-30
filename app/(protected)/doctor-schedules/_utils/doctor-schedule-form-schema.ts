import { z } from 'zod';

function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isTodayOrFuture(value: string) {
  if (!isDateOnly(value)) {
    return true;
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  return value >= today;
}

export const doctorScheduleFormSchema = z
  .object({
    doctorId: z.string().trim().min(1, 'Doctor is required'),
    rotaIds: z.array(z.number()).min(1, 'Doctor rota is required'),
    slotToDate: z
      .string()
      .trim()
      .min(1, 'Slot to date is required')
      .refine(isDateOnly, 'Slot to date must be a valid date')
      .refine(isTodayOrFuture, 'Slot to date cannot be in the past.'),
    slotFromDate: z
      .string()
      .trim()
      .min(1, 'Slot from date is required')
      .refine(isDateOnly, 'Slot from date must be a valid date')
      .refine(isTodayOrFuture, 'Slot from date cannot be in the past.'),
    slotInMinute: z
      .string()
      .trim()
      .min(1, 'Slot duration is required')
      .regex(/^\d+$/, 'Slot duration must be a whole number of minutes')
      .refine((value) => Number(value) > 0, 'Slot duration must be positive')
      .refine((value) => Number(value) <= 1440, 'Slot duration must be at most 1440 minutes'),
  })
  .refine((data) => data.slotToDate >= data.slotFromDate, {
    path: ['slotToDate'],
    message: 'Slot to date must be on or after slot from date',
  });

export type DoctorScheduleFormValues = z.infer<typeof doctorScheduleFormSchema>;
