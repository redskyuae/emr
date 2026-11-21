import { describe, expect, it } from 'vitest';

import { coercePropertyValue, pickDeclaredProperties, prop } from './event-spec';

describe('coercePropertyValue', () => {
  it('should round counts and never let them go negative', () => {
    expect(coercePropertyValue(prop.count(), 4.6)).toBe(5);
    expect(coercePropertyValue(prop.count(), -3)).toBe(0);
    expect(coercePropertyValue(prop.count(), '4')).toBeUndefined();
    expect(coercePropertyValue(prop.count(), Number.NaN)).toBeUndefined();
  });

  it('should let offsets be negative', () => {
    expect(coercePropertyValue(prop.offset(), -12.2)).toBe(-12);
  });

  it('should accept only HTTP status codes', () => {
    expect(coercePropertyValue(prop.status(), 409)).toBe(409);
    expect(coercePropertyValue(prop.status(), 42)).toBeUndefined();
  });

  it('should accept only declared enum values', () => {
    const spec = prop.enum(['NOW', 'LATER']);

    expect(coercePropertyValue(spec, 'NOW')).toBe('NOW');
    expect(coercePropertyValue(spec, 'Asha Nair')).toBeUndefined();
    expect(coercePropertyValue(prop.enumList(['a', 'b']), ['a', 'b'])).toEqual(['a', 'b']);
    expect(coercePropertyValue(prop.enumList(['a', 'b']), ['a', 'c'])).toBeUndefined();
  });

  it('should reject free text where a code is expected', () => {
    expect(coercePropertyValue(prop.code(), 'OPD')).toBe('OPD');
    expect(coercePropertyValue(prop.code(), 'Asia/Dubai')).toBe('Asia/Dubai');
    expect(coercePropertyValue(prop.code(), 'Asha Nair')).toBeUndefined();
    expect(coercePropertyValue(prop.code(), '')).toBeUndefined();
    expect(coercePropertyValue(prop.codeList(), ['DOCTOR', 'FRONT_DESK'])).toEqual([
      'DOCTOR',
      'FRONT_DESK',
    ]);
    expect(coercePropertyValue(prop.codeList(), ['DOCTOR', 'two words'])).toBeUndefined();
  });

  it('should reject a route that still carries an id or a query string', () => {
    expect(coercePropertyValue(prop.route(), '/patients/:id')).toBe('/patients/:id');
    expect(coercePropertyValue(prop.route(), '/patients/42')).toBeUndefined();
    expect(coercePropertyValue(prop.route(), '/patients?q=Asha')).toBeUndefined();
  });

  it('should accept only booleans for a flag', () => {
    expect(coercePropertyValue(prop.boolean(), false)).toBe(false);
    expect(coercePropertyValue(prop.boolean(), 'true')).toBeUndefined();
  });

  it('should accept only ISO timestamps in UTC', () => {
    expect(coercePropertyValue(prop.timestamp(), '2026-11-21T09:30:00.000Z')).toBe(
      '2026-11-21T09:30:00.000Z'
    );
    expect(coercePropertyValue(prop.timestamp(), '21/11/2026')).toBeUndefined();
  });
});

describe('pickDeclaredProperties', () => {
  it('should keep declared properties and drop the rest', () => {
    const specs = {
      booking_path: prop.enum(['CONSULTATION', 'PROCEDURE']),
      slot_count: prop.count(),
    };

    expect(
      pickDeclaredProperties(specs, {
        booking_path: 'CONSULTATION',
        slot_count: 2,
        patient_name: 'Asha Nair',
      })
    ).toEqual({ booking_path: 'CONSULTATION', slot_count: 2 });
  });

  it('should drop null, undefined and values that do not fit', () => {
    const specs = { status: prop.optional(prop.status()), kind: prop.enum(['a']) };

    expect(pickDeclaredProperties(specs, { status: null, kind: 'b' })).toEqual({});
  });
});
