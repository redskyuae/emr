import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

export const reasonFormSchema = z.object({
  name: simpleMasterNameSchema({
    max: 100,
    fieldName: 'Appointment reason name',
    maxMessage: 'Appointment reason name must be at most 100 characters',
    emptyMessage: 'Appointment reason name cannot be empty',
  }),
  code: simpleMasterCodeSchema({
    max: 10,
    fieldName: 'Appointment reason code',
    maxMessage: 'Appointment reason code must be at most 10 characters',
    emptyMessage: 'Appointment reason code cannot be empty',
  }),
  description: simpleMasterDescriptionSchema({
    maxMessage: 'Appointment reason description must be at most 500 characters',
  }),
});

export type ReasonFormValues = z.infer<typeof reasonFormSchema>;
