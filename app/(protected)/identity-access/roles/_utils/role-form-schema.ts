import { z } from 'zod';

export const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Role name is required.')
    .max(100, 'Role name must be at most 100 characters.'),
  code: z
    .string()
    .trim()
    .min(1, 'Role code is required.')
    .max(50, 'Role code must be at most 50 characters.'),
  description: z.string().trim(),
  permissionIds: z.array(z.number()),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
