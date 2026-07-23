import { z } from 'zod';

const optionalTextField = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);

const optionalMoneyField = (label: string) =>
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
  manufacturer: optionalTextField('Manufacturer', 150),
  model: optionalTextField('Model', 150),
  facility: optionalTextField('Facility', 150),
  department: optionalTextField('Department', 150),
  location: optionalTextField('Location', 200),
  custodian: optionalTextField('Custodian', 150),
  purchaseDate: z.string(),
  warrantyExpiry: z.string(),
  cost: optionalMoneyField('Cost'),
  currentValue: optionalMoneyField('Current value'),
  lastServiceDate: z.string(),
  nextServiceDate: z.string(),
  calibrationDate: z.string(),
});

export type AddAssetFormValues = z.infer<typeof addAssetFormSchema>;
