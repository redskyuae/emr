import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

// Client-side mirror of the create/update AdmissionType contract. Both operations
// require name and code, so both fields carry a required asterisk.
export const admissionTypeFormSchema = z.object({
  name: simpleMasterNameSchema({
    max: 100,
    fieldName: 'Admission type name',
    maxMessage: 'Admission type name must be at most 100 characters.',
    emptyMessage: 'Admission type name is required.',
  }),
  code: simpleMasterCodeSchema({
    max: 10,
    fieldName: 'Admission type code',
    maxMessage: 'Admission type code must be at most 10 characters.',
    emptyMessage: 'Admission type code is required.',
  }),
  description: simpleMasterDescriptionSchema({
    maxMessage: 'Admission type description must be at most 500 characters.',
  }),
});

export type AdmissionTypeFormValues = z.infer<typeof admissionTypeFormSchema>;
