import { describe, expect, it } from 'vitest';

import { createRoomSchema, roomIdSchema } from './room-schema';

const validRoom = {
  roomNumber: '101-A',
  roomTypeId: 3,
  status: 'AVAILABLE',
  bedCount: 2,
};

describe('Room schema', () => {
  it('should trim string fields and drop blank optional fields', () => {
    const result = createRoomSchema.safeParse({
      ...validRoom,
      roomNumber: '  101-A  ',
      floor: ' 1 ',
      wing: '   ',
      notes: '',
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        roomNumber: '101-A',
        floor: '1',
        wing: undefined,
        notes: undefined,
      },
    });
  });

  it('should require the room number, room type, status, and bed count', () => {
    const result = createRoomSchema.safeParse({});

    expect(result.success).toBe(false);

    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual(
      expect.arrayContaining(['Room number is required', 'Room type ID is required'])
    );
  });

  it('should reject a room number longer than 20 characters', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, roomNumber: 'a'.repeat(21) });

    expect(result.success).toBe(false);

    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain('Room number must be at most 20 characters');
  });

  it('should reject a status outside the Room Status set', () => {
    const result = createRoomSchema.safeParse({ ...validRoom, status: 'SLEEPING' });

    expect(result.success).toBe(false);

    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain(
      'Room status must be one of AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, CLEANING'
    );
  });

  it('should accept every Room Status the database allows', () => {
    for (const status of ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'CLEANING']) {
      expect(createRoomSchema.safeParse({ ...validRoom, status })).toMatchObject({
        success: true,
        data: { status },
      });
    }
  });

  it('should coerce the bed count and reject values outside 1 to 50', () => {
    expect(createRoomSchema.safeParse({ ...validRoom, bedCount: '4' })).toMatchObject({
      success: true,
      data: { bedCount: 4 },
    });

    const zero = createRoomSchema.safeParse({ ...validRoom, bedCount: 0 });
    expect(zero.success).toBe(false);
    const zeroMessages = zero.success ? [] : zero.error.issues.map((issue) => issue.message);
    expect(zeroMessages).toContain('Room bed count must be positive');

    const tooMany = createRoomSchema.safeParse({ ...validRoom, bedCount: 51 });
    expect(tooMany.success).toBe(false);
    const tooManyMessages = tooMany.success
      ? []
      : tooMany.error.issues.map((issue) => issue.message);
    expect(tooManyMessages).toContain('Room bed count must be at most 50');
  });

  it('should coerce a numeric id and reject a non-positive one', () => {
    expect(roomIdSchema.safeParse('12')).toMatchObject({ success: true, data: 12 });
    expect(roomIdSchema.safeParse('-1').success).toBe(false);
    expect(roomIdSchema.safeParse('abc').success).toBe(false);
  });
});
