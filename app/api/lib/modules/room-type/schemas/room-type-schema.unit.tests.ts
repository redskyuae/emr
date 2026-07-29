import { describe, expect, it } from 'vitest';

import { createRoomTypeSchema, roomTypeIdSchema } from './room-type-schema';

const validRoomType = {
  name: 'Private Room',
  code: 'PVT',
  color: '#2563EB',
};

const errorsOf = (result: ReturnType<typeof createRoomTypeSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('RoomType schema', () => {
  it('should trim the name, uppercase the code, and drop a blank description', () => {
    const result = createRoomTypeSchema.safeParse({
      name: '  Private Room  ',
      code: ' pvt ',
      color: '#2563EB',
      description: '   ',
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        name: 'Private Room',
        code: 'PVT',
        color: '#2563EB',
        description: undefined,
      },
    });
  });

  it('should require name, code, and color', () => {
    const result = createRoomTypeSchema.safeParse({});

    expect(result.success).toBe(false);

    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'Room type name is required',
        'Room type code is required',
        'Room type color is required',
      ])
    );
  });

  it('should reject a name longer than 100 characters', () => {
    const result = createRoomTypeSchema.safeParse({ ...validRoomType, name: 'a'.repeat(101) });

    expect(result.success).toBe(false);

    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain('Room type name must be at most 100 characters');
  });

  it('should reject a code longer than 10 characters', () => {
    const result = createRoomTypeSchema.safeParse({ ...validRoomType, code: 'a'.repeat(11) });

    expect(result.success).toBe(false);

    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain('Room type code must be at most 10 characters');
  });

  it('should reject a non-hex display color with the domain message', () => {
    const result = createRoomTypeSchema.safeParse({ ...validRoomType, color: 'blue' });

    expect(result.success).toBe(false);

    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toContain('Room type color must be a hex value like #2563EB.');
  });

  it('should treat an empty daily rate as absent', () => {
    const result = createRoomTypeSchema.safeParse({ ...validRoomType, dailyRate: '' });

    expect(result).toMatchObject({ success: true, data: { dailyRate: undefined } });
  });

  it('should accept a zero daily rate and reject a negative one', () => {
    expect(createRoomTypeSchema.safeParse({ ...validRoomType, dailyRate: 0 })).toMatchObject({
      success: true,
      data: { dailyRate: 0 },
    });

    const negative = createRoomTypeSchema.safeParse({ ...validRoomType, dailyRate: -1 });
    expect(negative.success).toBe(false);

    const messages = negative.success ? [] : negative.error.issues.map((issue) => issue.message);
    expect(messages).toContain('Room type daily rate must be non-negative');
  });

  it('should return validation error when description exceeds 500 characters', () => {
    expect(
      errorsOf(createRoomTypeSchema.safeParse({ ...validRoomType, description: 'a'.repeat(501) }))
    ).toContain('Room type description must be at most 500 characters');
  });

  it('should coerce a numeric id and reject a non-positive one', () => {
    expect(roomTypeIdSchema.safeParse('7')).toMatchObject({ success: true, data: 7 });
    expect(roomTypeIdSchema.safeParse('0').success).toBe(false);
    expect(roomTypeIdSchema.safeParse('abc').success).toBe(false);
  });

  it('should reject unsupported characters in name and code', () => {
    expect(
      errorsOf(createRoomTypeSchema.safeParse({ name: 'In.Person', code: 'INP', color: '#2563EB' }))
    ).toContain(
      'Room type name must contain only letters, spaces, hyphens, ampersands, slashes, apostrophes, commas, and parentheses.'
    );

    expect(
      errorsOf(
        createRoomTypeSchema.safeParse({ name: 'In Person', code: 'IN.P', color: '#2563EB' })
      )
    ).toContain('Room type code must contain only letters, numbers, hyphens, and underscores.');
  });
});
