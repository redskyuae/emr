import { z } from 'zod';
import {
  simpleMasterCodeSchema,
  simpleMasterDescriptionSchema,
  simpleMasterNameSchema,
} from '@/lib/validation/simple-master-fields';

export const roleFormSchema = z.object({
  name: simpleMasterNameSchema({
    max: 100,
    fieldName: 'Role name',
    maxMessage: 'Role name must be at most 100 characters.',
    emptyMessage: 'Role name is required.',
  }),
  code: simpleMasterCodeSchema({
    max: 50,
    fieldName: 'Role code',
    maxMessage: 'Role code must be at most 50 characters.',
    emptyMessage: 'Role code is required.',
  }),
  description: simpleMasterDescriptionSchema({
    maxMessage: 'Role description must be at most 500 characters.',
  }),
  permissionIds: z.array(z.number()),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
