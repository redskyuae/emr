import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { member, organization, user } from '@/app/db/schema/auth';

import { tenantRepository } from './tenant-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createTestOrganization = async (id: string, name: string, slug: string) => {
  const [created] = await db
    .insert(organization)
    .values({
      id,
      name,
      slug,
      logo: null,
      createdAt: new Date(),
      metadata: JSON.stringify({ isActive: true }),
    })
    .returning();
  return created;
};

const createTestUser = async (email: string, name: string) => {
  const [created] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      email,
      name,
      emailVerified: true,
    })
    .returning({ id: user.id });
  return created;
};

const createTestMember = async (userId: string, organizationId: string, role: string) => {
  const [created] = await db
    .insert(member)
    .values({
      id: randomUUID(),
      userId,
      organizationId,
      role,
      createdAt: new Date(),
    })
    .returning();
  return created;
};

describe('Tenant repository', () => {
  it('should get tenant by id', async () => {
    await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');

    const fetched = await tenantRepository.getTenantById(tenantA);

    expect(fetched).toMatchObject({
      id: tenantA,
      name: 'Hospital A',
      slug: 'hospital-a',
      isActive: true,
    });
  });

  it('should return undefined for non-existent tenant id', async () => {
    const fetched = await tenantRepository.getTenantById('non-existent');
    expect(fetched).toBeUndefined();
  });

  it('should find tenant by name case-insensitively', async () => {
    await createTestOrganization(tenantA, 'City Hospital', 'city-hospital');

    const fetched = await tenantRepository.findTenantByName('city hospital');
    expect(fetched).toMatchObject({
      id: tenantA,
      name: 'City Hospital',
    });
  });

  it('should find tenant by slug', async () => {
    await createTestOrganization(tenantA, 'Metro Health', 'metro-health');

    const fetched = await tenantRepository.findTenantBySlug('metro-health');
    expect(fetched).toMatchObject({
      id: tenantA,
      slug: 'metro-health',
    });
  });

  it('should return undefined when finding tenant by non-existent slug', async () => {
    const fetched = await tenantRepository.findTenantBySlug('non-existent');
    expect(fetched).toBeUndefined();
  });

  it('should find tenant by name excluding id', async () => {
    await createTestOrganization(tenantA, 'Regional Medical', 'regional-medical');

    const fetched = await tenantRepository.findTenantByName('Regional Medical', {
      excludeId: tenantA,
    });
    expect(fetched).toBeUndefined();
  });

  it('should find tenant by slug excluding id', async () => {
    await createTestOrganization(tenantA, 'County Health', 'county-health');

    const fetched = await tenantRepository.findTenantBySlug('county-health', {
      excludeId: tenantA,
    });
    expect(fetched).toBeUndefined();
  });

  it('should update tenant name', async () => {
    await createTestOrganization(tenantA, 'Old Name', 'old-name');

    const updated = await tenantRepository.updateTenant(tenantA, {
      name: 'New Name',
    });

    expect(updated).toMatchObject({
      id: tenantA,
      name: 'New Name',
    });
  });

  it('should update tenant logo', async () => {
    await createTestOrganization(tenantA, 'Test Hospital', 'test-hospital');

    const updated = await tenantRepository.updateTenant(tenantA, {
      logo: 'https://example.com/logo.png',
    });

    expect(updated).toMatchObject({
      id: tenantA,
      logo: 'https://example.com/logo.png',
    });
  });

  it('should not update tenant for non-existent id', async () => {
    const updated = await tenantRepository.updateTenant('non-existent', {
      name: 'New Name',
    });
    expect(updated).toBeUndefined();
  });

  it('should set tenant as active', async () => {
    // Create tenant with inactive metadata
    await db.insert(organization).values({
      id: tenantA,
      name: 'Test Hospital',
      slug: 'test-hospital',
      logo: null,
      createdAt: new Date(),
      metadata: JSON.stringify({ isActive: false }),
    });

    const updated = await tenantRepository.setTenantActive(tenantA, true);

    expect(updated).toMatchObject({
      id: tenantA,
      isActive: true,
    });
  });

  it('should set tenant as inactive', async () => {
    await createTestOrganization(tenantA, 'Test Hospital', 'test-hospital');

    const updated = await tenantRepository.setTenantActive(tenantA, false);

    expect(updated).toMatchObject({
      id: tenantA,
      isActive: false,
    });
  });

  it('should return undefined when setting active for non-existent tenant', async () => {
    const updated = await tenantRepository.setTenantActive('non-existent', true);
    expect(updated).toBeUndefined();
  });

  it('should find tenant membership', async () => {
    const testUser = await createTestUser('user@example.com', 'Test User');
    await createTestOrganization(tenantA, 'Test Hospital', 'test-hospital');
    await createTestMember(testUser.id, tenantA, 'owner');

    const membership = await tenantRepository.findTenantMembership(tenantA, testUser.id);

    expect(membership).toMatchObject({
      userId: testUser.id,
      tenantId: tenantA,
      role: 'owner',
    });
  });

  it('should return undefined for non-existent membership', async () => {
    const testUser = await createTestUser('user2@example.com', 'Test User 2');
    await createTestOrganization(tenantA, 'Test Hospital', 'test-hospital');

    const membership = await tenantRepository.findTenantMembership(tenantA, testUser.id);
    expect(membership).toBeUndefined();
  });

  it('should check if user is tenant member', async () => {
    const testUser = await createTestUser('user3@example.com', 'Test User 3');
    await createTestOrganization(tenantA, 'Test Hospital', 'test-hospital');
    await createTestMember(testUser.id, tenantA, 'member');

    const isMember = await tenantRepository.isTenantMember(tenantA, testUser.id);
    expect(isMember).toBe(true);

    const isNotMember = await tenantRepository.isTenantMember(tenantA, 'non-existent-user');
    expect(isNotMember).toBe(false);
  });

  it('should check if user is tenant owner', async () => {
    const testUser = await createTestUser('owner@example.com', 'Owner User');
    await createTestOrganization(tenantA, 'Test Hospital', 'test-hospital');
    await createTestMember(testUser.id, tenantA, 'owner');

    const isOwner = await tenantRepository.isTenantOwner(tenantA, testUser.id);
    expect(isOwner).toBe(true);

    // Non-owner member
    const memberUser = await createTestUser('member@example.com', 'Member User');
    await createTestMember(memberUser.id, tenantA, 'member');

    const isNotOwner = await tenantRepository.isTenantOwner(tenantA, memberUser.id);
    expect(isNotOwner).toBe(false);
  });

  it('should check tenant owner with comma-separated roles', async () => {
    const testUser = await createTestUser('admin@example.com', 'Admin User');
    await createTestOrganization(tenantA, 'Test Hospital', 'test-hospital');
    await createTestMember(testUser.id, tenantA, 'owner,admin');

    const isOwner = await tenantRepository.isTenantOwner(tenantA, testUser.id);
    expect(isOwner).toBe(true);
  });

  it('should parse metadata with isActive false as inactive tenant', async () => {
    await db.insert(organization).values({
      id: tenantA,
      name: 'Inactive Hospital',
      slug: 'inactive-hospital',
      logo: null,
      createdAt: new Date(),
      metadata: JSON.stringify({ isActive: false }),
    });

    const fetched = await tenantRepository.getTenantById(tenantA);
    expect(fetched?.isActive).toBe(false);
  });

  it('should parse missing metadata as active tenant', async () => {
    await db.insert(organization).values({
      id: tenantA,
      name: 'No Metadata Hospital',
      slug: 'no-metadata',
      logo: null,
      createdAt: new Date(),
      metadata: null,
    });

    const fetched = await tenantRepository.getTenantById(tenantA);
    expect(fetched?.isActive).toBe(true);
  });

  it('should parse invalid metadata as active tenant', async () => {
    await db.insert(organization).values({
      id: tenantA,
      name: 'Bad Metadata Hospital',
      slug: 'bad-metadata',
      logo: null,
      createdAt: new Date(),
      metadata: 'not-json',
    });

    const fetched = await tenantRepository.getTenantById(tenantA);
    expect(fetched?.isActive).toBe(true);
  });

  it('should parse array metadata as active tenant', async () => {
    await db.insert(organization).values({
      id: tenantA,
      name: 'Array Metadata Hospital',
      slug: 'array-metadata',
      logo: null,
      createdAt: new Date(),
      metadata: JSON.stringify([1, 2, 3]),
    });

    const fetched = await tenantRepository.getTenantById(tenantA);
    expect(fetched?.isActive).toBe(true);
  });

  it('should handle metadata with additional fields', async () => {
    await db.insert(organization).values({
      id: tenantA,
      name: 'Extra Metadata Hospital',
      slug: 'extra-metadata',
      logo: null,
      createdAt: new Date(),
      metadata: JSON.stringify({
        isActive: true,
        settings: { theme: 'dark', language: 'en' },
      }),
    });

    const fetched = await tenantRepository.getTenantById(tenantA);
    expect(fetched?.isActive).toBe(true);
  });
});
