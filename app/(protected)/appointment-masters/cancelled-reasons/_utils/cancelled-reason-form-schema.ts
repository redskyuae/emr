import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

export const cancelledReasonFormSchema = z.object({
  name: simpleMasterNameSchema({
    max: 100,
    fieldName: 'Appointment cancelled reason name',
    maxMessage: 'Appointment cancelled reason name must be at most 100 characters',
    emptyMessage: 'Appointment cancelled reason name cannot be empty',
  }),
  code: simpleMasterCodeSchema({
    max: 10,
    fieldName: 'Appointment cancelled reason code',
    maxMessage: 'Appointment cancelled reason code must be at most 10 characters',
    emptyMessage: 'Appointment cancelled reason code cannot be empty',
  }),
  description: simpleMasterDescriptionSchema({
    maxMessage: 'Appointment cancelled reason description must be at most 500 characters',
  }),
});

export type CancelledReasonFormValues = z.infer<typeof cancelledReasonFormSchema>;
