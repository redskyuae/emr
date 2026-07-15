import type { RoomType } from '@/app/api/lib/modules/room-type/schemas/room-type-schema';

export type GetRoomTypeResponse = {
  data: RoomType;
};

export type UpdateRoomTypeRequest = {
  name: string;
  code: string;
  color: string;
  dailyRate?: number;
  description?: string;
};

export type UpdateRoomTypeResponse = {
  data: RoomType;
};

export type DeleteRoomTypeResponse = void;
