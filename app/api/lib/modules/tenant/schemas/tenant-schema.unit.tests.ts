import { describe, expect, it } from 'vitest';

import {
  createTenantSchema,
  createTenantSlug,
  tenantIdSchema,
  tenantSlugSchema,
  updateTenantSchema,
} from './tenant-schema';

const createErrors = (result: ReturnType<typeof createTenantSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Tenant schema', () => {
  it('should require a name on create', () => {
    expect(createErrors(createTenantSchema.safeParse({}))).toContain('Tenant name is required');
  });

  it('should reject a non-url logo on create', () => {
    expect(
      createErrors(createTenantSchema.safeParse({ name: 'Apollo', logo: 'not-a-url' }))
    ).toContain('Tenant logo must be a valid URL');
  });

  it('should accept a valid create payload', () => {
    expect(
      createTenantSchema.parse({ name: ' Apollo ', logo: 'https://cdn.test/logo.png' })
    ).toEqual({
      name: 'Apollo',
      logo: 'https://cdn.test/logo.png',
    });
  });

  it('should require at least one field on update', () => {
    const result = updateTenantSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        'At least one tenant field is required'
      );
    }
  });

  it('should validate the tenant slug format', () => {
    expect(tenantSlugSchema.safeParse('apollo-hospitals').success).toBe(true);
    expect(tenantSlugSchema.safeParse('Apollo Hospitals').success).toBe(false);
  });

  it('should validate the tenant id', () => {
    expect(tenantIdSchema.safeParse('org-1').success).toBe(true);
    expect(tenantIdSchema.safeParse('   ').success).toBe(false);
  });

  it('should build a url-safe slug from a name', () => {
    expect(createTenantSlug('Apollo Hospitals!!')).toBe('apollo-hospitals');
  });
});
