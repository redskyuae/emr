import { describe, expect, it } from 'vitest';

import { getAvailableRooms } from './room-availability';

describe('Room availability', () => {
  it('shows every available Room regardless of Room Type', () => {
    const rooms = [
      { id: 1, status: 'AVAILABLE' as const, roomType: { name: 'Panchakarma room' } },
      { id: 2, status: 'CLEANING' as const, roomType: { name: 'Panchakarma room' } },
      { id: 3, status: 'AVAILABLE' as const, roomType: { name: 'Therapy room' } },
    ];

    expect(getAvailableRooms(rooms).map((room) => room.id)).toEqual([1, 3]);
  });
});
