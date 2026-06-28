import { StatusCodes } from 'http-status-codes';
import { auth, type Session } from '@/app/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { tenantRepository } from '../modules/tenant/repository/tenant-repository';

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

export async function requireTenantSession(): Promise<
  { session: Session; tenantId: string } | NextResponse
> {
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
