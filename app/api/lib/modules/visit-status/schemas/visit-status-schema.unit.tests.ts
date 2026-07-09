import { describe, expect, it } from 'vitest';

import {
  createVisitStatusSchema,
  visitStatusIdSchema,
  visitStatusTenantIdSchema,
} from './visit-status-schema';

const errorsOf = (result: ReturnType<typeof createVisitStatusSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const valid = { name: 'Waiting', code: 'WAIT', color: '#16A34A', category: 'WAITING' };

describe('VisitStatus schema', () => {
  it('should return validation error when name is missing', () => {
    expect(errorsOf(createVisitStatusSchema.safeParse({ ...valid, name: undefined }))).toContain(
      'Visit status name is required'
    );
  });

  it('should return validation error when name exceeds max length', () => {
    expect(
      errorsOf(createVisitStatusSchema.safeParse({ ...valid, name: 'a'.repeat(101) }))
    ).toContain('Visit status name must be at most 100 characters');
  });

  it('should return validation error when code is missing', () => {
    expect(errorsOf(createVisitStatusSchema.safeParse({ ...valid, code: undefined }))).toContain(
      'Visit status code is required'
    );
  });

  it('should return validation error when code exceeds max length', () => {
    expect(
      errorsOf(createVisitStatusSchema.safeParse({ ...valid, code: 'A'.repeat(11) }))
    ).toContain('Visit status code must be at most 10 characters');
  });

  it('should return validation error when color is not a valid hex value', () => {
    expect(errorsOf(createVisitStatusSchema.safeParse({ ...valid, color: 'green' }))).toContain(
      'Visit status color must be a hex value like #16A34A.'
    );
  });

  it('should return validation error when category is not one of the allowed values', () => {
    expect(
      errorsOf(createVisitStatusSchema.safeParse({ ...valid, category: 'PENDING' }))
    ).toContain('Visit status category must be one of WAITING, IN_PROGRESS, COMPLETED, or CANCELLED.');
  });

  it('should accept each allowed category value', () => {
    for (const category of ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) {
      expect(createVisitStatusSchema.safeParse({ ...valid, category }).success).toBe(true);
    }
  });

  it('should uppercase code on successful parse', () => {
    expect(createVisitStatusSchema.parse({ ...valid, code: 'wait' }).code).toBe('WAIT');
  });

  it('should trim name/code/description on successful parse', () => {
    expect(
      createVisitStatusSchema.parse({
        name: ' Waiting ',
        code: ' wait ',
        color: '#16A34A',
        category: 'WAITING',
        description: ' Patient checked in ',
      })
    ).toEqual({
      name: 'Waiting',
      code: 'WAIT',
      color: '#16A34A',
      category: 'WAITING',
      description: 'Patient checked in',
    });
  });

  it('should transform empty description to undefined', () => {
    expect(createVisitStatusSchema.parse({ ...valid, description: '   ' }).description).toBeUndefined();
  });

  it('should validate visit status id is positive integer', () => {
    expect(visitStatusIdSchema.safeParse('1').success).toBe(true);
    expect(visitStatusIdSchema.safeParse('0').success).toBe(false);
    expect(visitStatusIdSchema.safeParse('1.5').success).toBe(false);
  });

  it('should validate tenant id is non-empty string', () => {
    expect(visitStatusTenantIdSchema.safeParse('tenant-1').success).toBe(true);
    expect(visitStatusTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
