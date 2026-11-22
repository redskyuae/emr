import { asc, eq, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { member, organization, session, user } from '@/app/db/schema/auth';
import type { Tenant } from '../../tenant/schemas/tenant-schema';

const DEFAULT_TENANT_TIME_ZONE = 'Asia/Kolkata';

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

function getTenantTimeZone(metadata: string | null) {
  const timeZone = parseMetadata(metadata).timeZone;

  return typeof timeZone === 'string' && timeZone.trim() ? timeZone : DEFAULT_TENANT_TIME_ZONE;
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
    timeZone: getTenantTimeZone(row.metadata),
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

// The id of the Session a sign-in just created. The token is only used to find the
// row and is never returned or stored, so the Audit Log can name the Session
// without holding anything that could be replayed.
async function findSessionIdByToken(token: string): Promise<string | undefined> {
  const [row] = await db
    .select({ id: session.id })
    .from(session)
    .where(eq(session.token, token))
    .limit(1);

  return row?.id;
}

async function findUserByEmail(
  email: string
): Promise<{ id: string; name: string; email: string } | undefined> {
  const [row] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(sql`lower(${user.email})`, email.toLowerCase()))
    .limit(1);

  return row;
}

export const authRepository = {
  findUserByEmail,
  findSessionIdByToken,
  listActiveTenantsForUser,
};
