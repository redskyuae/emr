import { StatusCodes } from 'http-status-codes';
import { auth, type Session } from '@/app/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentUserRepository } from '../modules/current-user/repository/current-user-repository';
import { tenantRepository } from '../modules/tenant/repository/tenant-repository';
import { userRoleRepository } from '../modules/user-role/repository/user-role-repository';

export type TenantSession = { session: Session; tenantId: string };

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuth(): Promise<Session | NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
  }

  return session;
}

export async function requireTenantSession(): Promise<TenantSession | NextResponse> {
  const session = await requireAuth();

  if (session instanceof Response) {
    return session;
  }

  const tenantId = session.session.activeOrganizationId;

  if (!tenantId) {
    return NextResponse.json(
      { message: 'No active tenant selected.' },
      { status: StatusCodes.FORBIDDEN }
    );
  }

  return { session, tenantId };
}

export async function requireTenantPermissions(
  tenantSession: TenantSession,
  permissionKeys: readonly [string, ...string[]]
): Promise<NextResponse | null> {
  const { session, tenantId } = tenantSession;
  const membership = await tenantRepository.findTenantMembership(tenantId, session.user.id);

  if (!membership) {
    return NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN });
  }

  const assignedPermissionKeys = hasTenantAdminRole(membership.role)
    ? await currentUserRepository.getAllActivePermissionKeys()
    : await getTenantRolePermissionKeys(session.user.id, tenantId);
  const assignedPermissionKeySet = new Set(assignedPermissionKeys);

  if (permissionKeys.some((permissionKey) => !assignedPermissionKeySet.has(permissionKey))) {
    return NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN });
  }

  return null;
}

async function getTenantRolePermissionKeys(userId: string, tenantId: string) {
  const assignedRoles = await userRoleRepository.getAssignedRolesByUser(userId, tenantId);

  return currentUserRepository.getPermissionKeysByRoleIds(
    assignedRoles.map((role) => role.id),
    tenantId
  );
}

export function hasTenantAdminRole(role: string) {
  return role
    .split(',')
    .map((value) => value.trim())
    .some((value) => value === 'owner' || value === 'admin');
}

export async function requireTenantAdminSession(): Promise<
  { session: Session; tenantId: string } | NextResponse
> {
  const tenantSession = await requireTenantSession();

  if (tenantSession instanceof Response) {
    return tenantSession;
  }

  const membership = await tenantRepository.findTenantMembership(
    tenantSession.tenantId,
    tenantSession.session.user.id
  );

  if (!membership || !hasTenantAdminRole(membership.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN });
  }

  return tenantSession;
}
