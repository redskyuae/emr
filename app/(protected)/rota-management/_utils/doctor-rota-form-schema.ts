import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutesOf(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export const doctorRotaFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Doctor rota name cannot be empty')
      .max(100, 'Doctor rota name must be at most 100 characters'),
    fromTime: z
      .string()
      .trim()
      .min(1, 'Doctor rota from time cannot be empty')
      .regex(timePattern, 'Doctor rota from time must be in HH:mm format'),
    toTime: z
      .string()
      .trim()
      .min(1, 'Doctor rota to time cannot be empty')
      .regex(timePattern, 'Doctor rota to time must be in HH:mm format'),
  })
  .refine((values) => minutesOf(values.toTime) > minutesOf(values.fromTime), {
    path: ['toTime'],
    message: 'Doctor rota to time must be after from time',
  });

export type DoctorRotaFormValues = z.infer<typeof doctorRotaFormSchema>;
