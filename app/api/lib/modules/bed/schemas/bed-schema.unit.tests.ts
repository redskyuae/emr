import { describe, expect, it } from 'vitest';

import { bedIdSchema, bedTenantIdSchema, createBedSchema, updateBedSchema } from './bed-schema';

describe('Bed schema', () => {
  it('should require bed number and ward id', () => {
    const result = createBedSchema.safeParse({});

    expect(result.success).toBe(false);

    const messages = result.error?.issues.map((issue) => issue.message);
    expect(messages).toContain('Bed number is required');
    expect(messages).toContain('Ward ID is required');
  });

  it('should reject a blank bed number', () => {
    const result = createBedSchema.safeParse({ bedNumber: '   ', wardId: 1 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Bed number cannot be empty');
  });

  it('should reject a bed number longer than 20 characters', () => {
    const result = createBedSchema.safeParse({ bedNumber: 'B'.repeat(21), wardId: 1 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Bed number must be at most 20 characters');
  });

  it('should trim the bed number and default status to AVAILABLE', () => {
    expect(createBedSchema.parse({ bedNumber: ' ICU-01 ', wardId: '3' })).toEqual({
      bedNumber: 'ICU-01',
      wardId: 3,
      roomId: undefined,
      status: 'AVAILABLE',
      notes: undefined,
    });
  });

  it('should accept the manually settable statuses', () => {
    for (const status of ['AVAILABLE', 'RESERVED', 'MAINTENANCE'] as const) {
      expect(createBedSchema.parse({ bedNumber: 'ICU-01', wardId: 1, status })).toMatchObject({
        status,
      });
    }
  });

  it('should reject OCCUPIED with the system-managed message', () => {
    const result = createBedSchema.safeParse({
      bedNumber: 'ICU-01',
      wardId: 1,
      status: 'OCCUPIED',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Bed status OCCUPIED cannot be set manually.');
  });

  it('should reject an unknown status with the allowed list', () => {
    const result = createBedSchema.safeParse({ bedNumber: 'ICU-01', wardId: 1, status: 'BROKEN' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Bed status must be one of AVAILABLE, RESERVED, MAINTENANCE'
    );
  });

  it('should treat a null or empty room id as absent', () => {
    expect(createBedSchema.parse({ bedNumber: 'ICU-01', wardId: 1, roomId: null })).toMatchObject({
      roomId: undefined,
    });
    expect(createBedSchema.parse({ bedNumber: 'ICU-01', wardId: 1, roomId: '' })).toMatchObject({
      roomId: undefined,
    });
  });

  it('should coerce a numeric-string room id', () => {
    expect(createBedSchema.parse({ bedNumber: 'ICU-01', wardId: 1, roomId: '12' })).toMatchObject({
      roomId: 12,
    });
  });

  it('should reject notes longer than 500 characters and blank notes become absent', () => {
    const tooLong = createBedSchema.safeParse({
      bedNumber: 'ICU-01',
      wardId: 1,
      notes: 'x'.repeat(501),
    });

    expect(tooLong.success).toBe(false);
    expect(tooLong.error?.issues[0]?.message).toBe('Bed notes must be at most 500 characters');

    expect(createBedSchema.parse({ bedNumber: 'ICU-01', wardId: 1, notes: '  ' })).toMatchObject({
      notes: undefined,
    });
  });

  it('should accept the same shape for update as for create', () => {
    expect(updateBedSchema.parse({ bedNumber: 'ICU-02', wardId: 2, status: 'RESERVED' })).toEqual({
      bedNumber: 'ICU-02',
      wardId: 2,
      roomId: undefined,
      status: 'RESERVED',
      notes: undefined,
    });
  });

  it('should coerce and validate the bed id', () => {
    expect(bedIdSchema.parse('7')).toBe(7);
    expect(bedIdSchema.safeParse('abc').success).toBe(false);
    expect(bedIdSchema.safeParse('-1').success).toBe(false);
    expect(bedIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should trim the tenant id and reject blanks', () => {
    expect(bedTenantIdSchema.parse(' tenant-1 ')).toBe('tenant-1');
    expect(bedTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
