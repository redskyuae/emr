import { z } from 'zod';

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const roomTypeNameSchema = z
  .string({ error: 'Room type name is required' })
  .trim()
  .min(1, 'Room type name cannot be empty')
  .max(100, 'Room type name must be at most 100 characters')
  .regex(
    /^(?=.*\p{L})[\p{L} ,&'()/-]+$/u,
    'Room type name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
  );

const roomTypeCodeSchema = z
  .string({ error: 'Room type code is required' })
  .trim()
  .min(1, 'Room type code cannot be empty')
  .max(10, 'Room type code must be at most 10 characters')
  .regex(
    /^(?=.*[A-Za-z0-9])[A-Za-z0-9_-]+$/,
    'Room type code must contain only letters, numbers, hyphens, and underscores.'
  )
  .transform((code) => code.toUpperCase());

const roomTypeColorSchema = z
  .string({ error: 'Room type color is required' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Room type color must be a hex value like #2563EB.');

const roomTypeDailyRateSchema = z.preprocess(
  (value) => (value === null || value === undefined || value === '' ? undefined : value),
  z
    .number({ error: 'Room type daily rate must be a number' })
    .nonnegative('Room type daily rate must be non-negative')
    .max(99999999.99, 'Room type daily rate must be at most 99999999.99')
    .optional()
);

const roomTypeDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Room type description must be at most 500 characters')
  .transform((description) => (description === '' ? undefined : description))
  .optional();

export const roomTypeIdSchema = z.coerce
  .number({ error: 'Room type ID is required' })
  .int('Room type ID must be an integer')
  .positive('Room type ID must be positive');

export const roomTypeTenantIdSchema = tenantIdSchema;

export const createRoomTypeSchema = z.object({
  code: roomTypeCodeSchema,
  name: roomTypeNameSchema,
  color: roomTypeColorSchema,
  dailyRate: roomTypeDailyRateSchema,
  description: roomTypeDescriptionSchema,
});

export const updateRoomTypeSchema = createRoomTypeSchema;

export type RoomTypeIdInput = z.infer<typeof roomTypeIdSchema>;
export type RoomTypeTenantIdInput = z.infer<typeof roomTypeTenantIdSchema>;
export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;
export type CreateRoomTypeData = CreateRoomTypeInput & { tenantId: string };
export type UpdateRoomTypeData = UpdateRoomTypeInput & { tenantId: string };

export type RoomType = {
  id: number;
  name: string;
  code: string;
  color: string;
  createdOn: Date;
  tenantId: string;
  modifiedOn: Date;
  dailyRate: number | null;
  description: string | null;
};

export type RoomTypeListParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: string;
};
