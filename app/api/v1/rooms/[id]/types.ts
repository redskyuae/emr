import type { Room, RoomStatus } from '@/app/api/lib/modules/room/schemas/room-schema';

export type GetRoomResponse = {
  data: Room;
};

export type UpdateRoomRequest = {
  roomNumber: string;
  roomTypeId: number;
  status: RoomStatus;
  bedCount: number;
  floor?: string;
  wing?: string;
  facility?: string;
  department?: string;
  notes?: string;
};

export type UpdateRoomResponse = {
  data: Room;
};

export type DeleteRoomResponse = void;
