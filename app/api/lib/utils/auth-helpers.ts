import { auth, type Session } from '@/app/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuth(): Promise<Session | NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
    return NextResponse.json({ message: 'Tenant session required' }, { status: 403 });
  }

  return { session, tenantId };
}
