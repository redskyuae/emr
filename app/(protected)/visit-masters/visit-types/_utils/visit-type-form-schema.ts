import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

// Client-side mirror of the create/update VisitType contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const visitTypeFormSchema = z.object({
  name: simpleMasterNameSchema({
    max: 100,
    fieldName: 'Visit type name',
    maxMessage: 'Visit type name must be at most 100 characters.',
    emptyMessage: 'Visit type name is required.',
  }),
  code: simpleMasterCodeSchema({
    max: 10,
    fieldName: 'Visit type code',
    maxMessage: 'Visit type code must be at most 10 characters.',
    emptyMessage: 'Visit type code is required.',
  }),
  description: simpleMasterDescriptionSchema({
    maxMessage: 'Visit type description must be at most 500 characters.',
  }),
});

export type VisitTypeFormValues = z.infer<typeof visitTypeFormSchema>;
