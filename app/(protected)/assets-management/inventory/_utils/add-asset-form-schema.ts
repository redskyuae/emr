import { z } from 'zod';

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

const optionalMoney = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) >= 0),
      `${label} must be a non-negative number.`
    );

export const addAssetFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Asset name is required.')
    .max(150, 'Asset name must be at most 150 characters.'),
  serialNumber: z
    .string()
    .trim()
    .min(1, 'Serial number is required.')
    .max(100, 'Serial number must be at most 100 characters.'),
  categoryId: z
    .string()
    .trim()
    .min(1, 'Category is required.')
    .refine((value) => /^\d+$/.test(value), 'Category is required.'),
  statusId: z
    .string()
    .trim()
    .min(1, 'Status is required.')
    .refine((value) => /^\d+$/.test(value), 'Status is required.'),
  conditionId: z.string().trim(),
  manufacturer: optionalText(150, 'Manufacturer'),
  model: optionalText(150, 'Model'),
  facility: optionalText(150, 'Facility'),
  department: optionalText(150, 'Department'),
  location: optionalText(200, 'Location'),
  custodian: optionalText(150, 'Custodian'),
  purchaseDate: z.string(),
  warrantyExpiry: z.string(),
  cost: optionalMoney('Cost'),
  currentValue: optionalMoney('Current value'),
  lastServiceDate: z.string(),
  nextServiceDate: z.string(),
  calibrationDate: z.string(),
});

export type AddAssetFormValues = z.infer<typeof addAssetFormSchema>;
