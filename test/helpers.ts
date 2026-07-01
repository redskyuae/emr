import { randomUUID } from 'node:crypto';

import { db } from '@/app/db';
import { member, organization, user } from '@/app/db/schema/auth';

// Tenant-scoped tables (role, staff_profile, ...) carry a `tenantId` FK to the
// BetterAuth `organization` table, so integration tests must seed an org row for
// each tenant id they use before inserting tenant-scoped data.
export async function seedOrganization(id: string) {
  await db
    .insert(organization)
    .values({ id, name: id, slug: id, createdAt: new Date() })
    .onConflictDoNothing();
}

export async function createTestUser(
  overrides: { id?: string; name?: string; email?: string } = {}
) {
  const id = overrides.id ?? randomUUID();
  const [created] = await db
    .insert(user)
    .values({
      id,
      name: overrides.name ?? 'Test User',
      email: overrides.email ?? `${id}@example.com`,
      emailVerified: true,
    })
    .returning();
  return created!;
}

export async function addOrganizationMember(organizationId: string, userId: string, role: string) {
  const [created] = await db
    .insert(member)
    .values({ id: randomUUID(), organizationId, userId, role, createdAt: new Date() })
    .returning();
  return created!;
}
