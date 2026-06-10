import { and, eq, ne, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { member, organization } from '@/app/db/schema/auth';
import type { Tenant, TenantMembership, UpdateTenantInput } from '../schemas/tenant-schema';

const tenantColumns = {
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  logo: organization.logo,
  metadata: organization.metadata,
  createdAt: organization.createdAt,
};

const membershipColumns = {
  id: member.id,
  tenantId: member.organizationId,
  userId: member.userId,
  role: member.role,
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
  } satisfies Tenant;
}

function hasOwnerRole(role: string) {
  return role
    .split(',')
    .map((value) => value.trim())
    .includes('owner');
}

async function getTenantById(id: string) {
  const [tenant] = await db
    .select(tenantColumns)
    .from(organization)
    .where(eq(organization.id, id))
    .limit(1);

  return tenant ? toTenant(tenant) : undefined;
}

async function findTenantByName(name: string, { excludeId }: { excludeId?: string } = {}) {
  const [tenant] = await db
    .select(tenantColumns)
    .from(organization)
    .where(
      and(
        sql`lower(${organization.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(organization.id, excludeId) : undefined
      )
    )
    .limit(1);

  return tenant ? toTenant(tenant) : undefined;
}

async function findTenantBySlug(slug: string, { excludeId }: { excludeId?: string } = {}) {
  const [tenant] = await db
    .select(tenantColumns)
    .from(organization)
    .where(and(eq(organization.slug, slug), excludeId ? ne(organization.id, excludeId) : undefined))
    .limit(1);

  return tenant ? toTenant(tenant) : undefined;
}

async function updateTenant(id: string, data: UpdateTenantInput) {
  const updateData: Partial<Pick<TenantRow, 'name' | 'logo'>> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.logo !== undefined) {
    updateData.logo = data.logo;
  }

  const [updatedTenant] = await db
    .update(organization)
    .set(updateData)
    .where(eq(organization.id, id))
    .returning(tenantColumns);

  return updatedTenant ? toTenant(updatedTenant) : undefined;
}

async function setTenantActive(id: string, isActive: boolean) {
  const [tenant] = await db
    .select(tenantColumns)
    .from(organization)
    .where(eq(organization.id, id))
    .limit(1);

  if (!tenant) {
    return undefined;
  }

  const metadata = {
    ...parseMetadata(tenant.metadata),
    isActive,
  };

  const [updatedTenant] = await db
    .update(organization)
    .set({ metadata: JSON.stringify(metadata) })
    .where(eq(organization.id, id))
    .returning(tenantColumns);

  return updatedTenant ? toTenant(updatedTenant) : undefined;
}

async function findTenantMembership(tenantId: string, userId: string) {
  const [membership] = await db
    .select(membershipColumns)
    .from(member)
    .where(and(eq(member.organizationId, tenantId), eq(member.userId, userId)))
    .limit(1);

  return membership satisfies TenantMembership | undefined;
}

async function isTenantMember(tenantId: string, userId: string) {
  return Boolean(await findTenantMembership(tenantId, userId));
}

async function isTenantOwner(tenantId: string, userId: string) {
  const membership = await findTenantMembership(tenantId, userId);

  return membership ? hasOwnerRole(membership.role) : false;
}

export const tenantRepository = {
  getTenantById,
  findTenantByName,
  findTenantBySlug,
  updateTenant,
  setTenantActive,
  findTenantMembership,
  isTenantMember,
  isTenantOwner,
};
