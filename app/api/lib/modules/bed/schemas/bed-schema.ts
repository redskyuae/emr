import { z } from 'zod';

import { BED_STATUSES } from '@/app/db/schema/bed';

export const MANUAL_BED_STATUSES = ['AVAILABLE', 'RESERVED', 'MAINTENANCE'] as const;

const tenantIdSchema = z
  .string({ error: 'Tenant ID is required' })
  .trim()
  .min(1, 'Tenant ID cannot be empty');

const optionalTrimmedString = (schema: z.ZodString) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, schema.optional());

const bedNumberSchema = z
  .string({ error: 'Bed number is required' })
  .trim()
  .min(1, 'Bed number cannot be empty')
  .max(20, 'Bed number must be at most 20 characters');

const bedWardIdSchema = z.coerce
  .number({ error: 'Ward ID is required' })
  .int('Ward ID must be an integer')
  .positive('Ward ID must be positive');

const bedRoomIdSchema = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.coerce
    .number({ error: 'Room ID must be a number' })
    .int('Room ID must be an integer')
    .positive('Room ID must be positive')
    .optional()
);

// OCCUPIED is system-managed (ADR 0033): admission transactions set and clear it,
// so the manual create/update contract only ever accepts the other three values.
const bedStatusSchema = z
  .enum(MANUAL_BED_STATUSES, {
    error: (issue) =>
      issue.input === 'OCCUPIED'
        ? 'Bed status OCCUPIED cannot be set manually.'
        : `Bed status must be one of ${MANUAL_BED_STATUSES.join(', ')}`,
  })
  .default('AVAILABLE');

export const bedIdSchema = z.coerce
  .number({ error: 'Bed ID is required' })
  .int('Bed ID must be an integer')
  .positive('Bed ID must be positive');

export const bedTenantIdSchema = tenantIdSchema;

export const bedPayloadSchema = z.object({
  bedNumber: bedNumberSchema,
  wardId: bedWardIdSchema,
  roomId: bedRoomIdSchema,
  status: bedStatusSchema,
  notes: optionalTrimmedString(
    z.string().trim().max(500, 'Bed notes must be at most 500 characters')
  ),
});

export const createBedSchema = bedPayloadSchema;
export const updateBedSchema = bedPayloadSchema;

export type BedStatus = (typeof BED_STATUSES)[number];
export type BedIdInput = z.infer<typeof bedIdSchema>;
export type CreateBedInput = z.infer<typeof createBedSchema>;
export type UpdateBedInput = z.infer<typeof updateBedSchema>;
export type BedTenantIdInput = z.infer<typeof bedTenantIdSchema>;
export type CreateBedData = CreateBedInput & { tenantId: string };
export type UpdateBedData = UpdateBedInput & { tenantId: string };

export type BedWardSummary = {
  id: number;
  name: string;
  code: string;
};

export type BedRoomSummary = {
  id: number;
  roomNumber: string;
};

export type Bed = {
  id: number;
  wardId: number;
  tenantId: string;
  createdOn: Date;
  bedNumber: string;
  modifiedOn: Date;
  status: BedStatus;
  notes: string | null;
  roomId: number | null;
  ward: BedWardSummary;
  room: BedRoomSummary | null;
};

export type BedBoardOccupant = {
  mrn: string;
  patientId: number;
  lastName: string;
  firstName: string;
  admissionId: number;
  admissionNumber: string;
};

export type BedBoardBed = {
  id: number;
  bedNumber: string;
  status: BedStatus;
  roomNumber: string | null;
  occupant: BedBoardOccupant | null;
};

export type BedBoardWard = {
  wardId: number;
  wardName: string;
  wardCode: string;
  beds: BedBoardBed[];
};

export type BedListParams = {
  page?: number;
  limit?: number;
  query?: string;
  wardId?: number;
  tenantId: string;
  status?: BedStatus;
};
