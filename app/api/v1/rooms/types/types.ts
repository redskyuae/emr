import type { RoomType } from '@/app/api/lib/modules/room-type/schemas/room-type-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListRoomTypesResponse = Paginated<RoomType>;

export type SaveRoomTypeRequest = {
  name: string;
  code: string;
  color: string;
  dailyRate?: number;
  description?: string;
};

export type SaveRoomTypeResponse = {
  data: RoomType;
};
