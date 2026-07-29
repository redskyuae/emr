import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

// Client-side mirror of the create/update Ward contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const wardFormSchema = z.object({
  name: simpleMasterNameSchema({
    max: 100,
    fieldName: 'Ward name',
    maxMessage: 'Ward name must be at most 100 characters.',
    emptyMessage: 'Ward name is required.',
  }),
  code: simpleMasterCodeSchema({
    max: 10,
    fieldName: 'Ward code',
    maxMessage: 'Ward code must be at most 10 characters.',
    emptyMessage: 'Ward code is required.',
  }),
  description: simpleMasterDescriptionSchema({
    maxMessage: 'Ward description must be at most 500 characters.',
  }),
});

export type WardFormValues = z.infer<typeof wardFormSchema>;
