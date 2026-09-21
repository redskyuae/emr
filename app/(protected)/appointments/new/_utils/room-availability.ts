import type { Room } from '@/app/api/lib/modules/room/schemas/room-schema';

export function getAvailableRooms<TRoom extends Pick<Room, 'status'>>(rooms: TRoom[]) {
  return rooms.filter((room) => room.status === 'AVAILABLE');
}
