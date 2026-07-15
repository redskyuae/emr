import { z } from 'zod';

import { ROOM_STATUSES } from '@/app/db/schema/room';

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

const roomNumberSchema = z
  .string({ error: 'Room number is required' })
  .trim()
  .min(1, 'Room number cannot be empty')
  .max(20, 'Room number must be at most 20 characters');

const roomTypeIdSchema = z.coerce
  .number({ error: 'Room type ID is required' })
  .int('Room type ID must be an integer')
  .positive('Room type ID must be positive');

const roomStatusSchema = z.enum(ROOM_STATUSES, {
  error: `Room status must be one of ${ROOM_STATUSES.join(', ')}`,
});

const bedCountSchema = z.coerce
  .number({ error: 'Room bed count is required' })
  .int('Room bed count must be an integer')
  .positive('Room bed count must be positive')
  .max(50, 'Room bed count must be at most 50');

export const roomIdSchema = z.coerce
  .number({ error: 'Room ID is required' })
  .int('Room ID must be an integer')
  .positive('Room ID must be positive');

export const roomTenantIdSchema = tenantIdSchema;

export const roomPayloadSchema = z.object({
  roomNumber: roomNumberSchema,
  roomTypeId: roomTypeIdSchema,
  status: roomStatusSchema,
  bedCount: bedCountSchema,
  floor: optionalTrimmedString(
    z.string().trim().max(20, 'Room floor must be at most 20 characters')
  ),
  wing: optionalTrimmedString(z.string().trim().max(50, 'Room wing must be at most 50 characters')),
  facility: optionalTrimmedString(
    z.string().trim().max(150, 'Room facility must be at most 150 characters')
  ),
  department: optionalTrimmedString(
    z.string().trim().max(150, 'Room department must be at most 150 characters')
  ),
  notes: optionalTrimmedString(
    z.string().trim().max(500, 'Room notes must be at most 500 characters')
  ),
});

export const createRoomSchema = roomPayloadSchema;
export const updateRoomSchema = roomPayloadSchema;

export type RoomStatus = (typeof ROOM_STATUSES)[number];
export type RoomIdInput = z.infer<typeof roomIdSchema>;
export type RoomTenantIdInput = z.infer<typeof roomTenantIdSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateRoomData = CreateRoomInput & { tenantId: string };
export type UpdateRoomData = UpdateRoomInput & { tenantId: string };

export type RoomTypeSummary = {
  id: number;
  name: string;
  code: string;
  color: string;
  dailyRate: number | null;
};

export type Room = {
  id: number;
  wing: string | null;
  floor: string | null;
  status: RoomStatus;
  bedCount: number;
  tenantId: string;
  createdOn: Date;
  modifiedOn: Date;
  roomTypeId: number;
  roomNumber: string;
  notes: string | null;
  facility: string | null;
  department: string | null;
  roomType: RoomTypeSummary;
};

export type RoomStatusCount = {
  count: number;
  status: RoomStatus;
};

export type RoomTypeCount = {
  name: string;
  color: string;
  count: number;
  roomTypeId: number;
};

export type RoomSummary = {
  byType: RoomTypeCount[];
  totalRooms: number;
  totalBeds: number;
  byStatus: RoomStatusCount[];
  availableRooms: number;
  occupancyRate: number;
};

export type RoomListParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: string;
  status?: RoomStatus;
  roomTypeId?: number;
};
