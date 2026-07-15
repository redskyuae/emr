import type { Room, RoomStatus } from '@/app/api/lib/modules/room/schemas/room-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListRoomsResponse = Paginated<Room>;

export type SaveRoomRequest = {
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

export type SaveRoomResponse = {
  data: Room;
};
