import { asc, eq } from 'drizzle-orm';

import { db } from '@/app/db';
import { member, organization } from '@/app/db/schema/auth';
import type { Tenant } from '../../tenant/schemas/tenant-schema';

const tenantColumns = {
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  logo: organization.logo,
  metadata: organization.metadata,
  createdAt: organization.createdAt,
};

type TenantRow = typeof organization.$inferSelect;

function parseMetadata(metadata: string | null) {
  if (!metadata) {
    return {};
  }

  try {
    const parsed = JSON.parse(metadata) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isActiveTenant(metadata: string | null) {
  return parseMetadata(metadata).isActive !== false;
}

function isOnboardedTenant(metadata: string | null) {
  return typeof parseMetadata(metadata).onboardedAt === 'string';
}

function toTenant(
  row: Pick<TenantRow, 'id' | 'name' | 'slug' | 'logo' | 'metadata' | 'createdAt'>
) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    isActive: isActiveTenant(row.metadata),
    createdAt: row.createdAt,
    isOnboarded: isOnboardedTenant(row.metadata),
  } satisfies Tenant;
}

async function listActiveTenantsForUser(userId: string) {
  const tenants = await db
    .select(tenantColumns)
    .from(organization)
    .innerJoin(member, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId))
    .orderBy(asc(organization.createdAt), asc(organization.id));

  return tenants.map((tenant) => toTenant(tenant)).filter((tenant) => tenant.isActive);
}

export const authRepository = {
  listActiveTenantsForUser,
};
