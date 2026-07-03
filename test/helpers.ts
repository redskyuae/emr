import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { db } from '@/app/db';
import { member, organization, user } from '@/app/db/schema/auth';
import { permission as permissionTable } from '@/app/db/schema/permission';

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

// The permission catalogue has no public deactivate/update API — it is only ever
// seeded and read — so tests that need an inactive row to assert filtering behavior
// must reach past the repository. Centralized here to avoid duplicating the raw
// Drizzle write across every module that needs this fixture.
export async function deactivatePermission(id: number) {
  await db.update(permissionTable).set({ isActive: false }).where(eq(permissionTable.id, id));
}
