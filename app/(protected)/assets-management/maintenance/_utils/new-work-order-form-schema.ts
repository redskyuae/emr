import { z } from 'zod';

const requiredIdField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => /^\d+$/.test(value), `${label} is required.`);

export const newWorkOrderFormSchema = z.object({
  assetId: requiredIdField('Asset'),
  typeId: requiredIdField('Type'),
  priorityId: requiredIdField('Priority'),
  statusId: requiredIdField('Status'),
  technician: z.string().trim().max(150, 'Technician must be at most 150 characters.'),
  dueDate: z.string(),
  note: z.string().trim(),
});

export type NewWorkOrderFormValues = z.infer<typeof newWorkOrderFormSchema>;
