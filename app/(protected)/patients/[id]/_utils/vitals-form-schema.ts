import { z } from 'zod';

const MEASUREMENT_KEYS = [
  'heightCm',
  'weightKg',
  'systolic',
  'diastolic',
  'pulseBpm',
  'respRate',
  'temperatureC',
  'spo2',
  'painScore',
] as const;

const optionalNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .refine((value) => value === '' || !Number.isNaN(Number(value)), {
      message: `${label} must be a number`,
    })
    .refine((value) => value === '' || (Number(value) >= min && Number(value) <= max), {
      message: `${label} must be between ${min} and ${max}`,
    });

export const vitalsFormSchema = z
  .object({
    recordedAt: z.string(),
    heightCm: optionalNumber('Height', 0, 300),
    weightKg: optionalNumber('Weight', 0, 700),
    systolic: optionalNumber('Systolic', 0, 400),
    diastolic: optionalNumber('Diastolic', 0, 400),
    pulseBpm: optionalNumber('Pulse', 0, 400),
    respRate: optionalNumber('Respiratory rate', 0, 150),
    temperatureC: optionalNumber('Temperature', 20, 45),
    spo2: optionalNumber('SpO₂', 0, 100),
    painScore: optionalNumber('Pain score', 0, 10),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters'),
  })
  .refine((data) => MEASUREMENT_KEYS.some((key) => data[key] !== ''), {
    message: 'Enter at least one measurement',
    path: ['systolic'],
  });

export type VitalsFormValues = z.infer<typeof vitalsFormSchema>;

export const vitalsFormDefaults: VitalsFormValues = {
  recordedAt: '',
  heightCm: '',
  weightKg: '',
  systolic: '',
  diastolic: '',
  pulseBpm: '',
  respRate: '',
  temperatureC: '',
  spo2: '',
  painScore: '',
  notes: '',
};
