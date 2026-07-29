import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

export const workOrderPriorityFormSchema = z.object({
  name: simpleMasterNameSchema({
    max: 100,
    fieldName: 'Name',
    maxMessage: 'Name must be at most 100 characters.',
    emptyMessage: 'Name is required.',
  }),
  code: simpleMasterCodeSchema({
    max: 10,
    fieldName: 'Code',
    maxMessage: 'Code must be at most 10 characters.',
    emptyMessage: 'Code is required.',
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value like #16A34A.'),
  description: simpleMasterDescriptionSchema({
    maxMessage: 'Description must be at most 500 characters.',
  }),
});

export type WorkOrderPriorityFormValues = z.infer<typeof workOrderPriorityFormSchema>;
