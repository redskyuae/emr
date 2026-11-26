import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
import { signoutCommand } from '@/app/api/lib/modules/auth/commands/signout-command';
import { getSession } from '@/app/api/lib/utils/auth-helpers';

// Why the browser ended the Session (the `trigger` query parameter), as the Audit
// Log reads it. An unknown or missing trigger is recorded without a reason.
const SIGN_OUT_REASONS: Record<string, string> = {
  user: 'Signed out by the user',
  stale_tab: 'Ended because the browser tab was closed or reopened',
  idle_timeout: 'Signed out after inactivity',
  session_expired: 'Session expired',
  tab_storage_unavailable: 'Browser storage was unavailable',
};

async function currentSessionForAudit() {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

function appendSetCookies(response: NextResponse, setCookies: string[]) {
  for (const setCookie of setCookies) {
    response.headers.append('Set-Cookie', setCookie);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read before signing out: once the Session is gone there is no one to record.
    const ending = await currentSessionForAudit();
    const result = await signoutCommand(request.headers);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    const tenantId = ending?.session.activeOrganizationId;

    if (ending && tenantId) {
      const trigger = request.nextUrl.searchParams.get('trigger') ?? '';

      await recordAuditEventFor(
        {
          tenantId,
          userId: ending.user.id,
          name: ending.user.name,
          email: ending.user.email,
          sessionId: ending.session.id,
          impersonatedBy: ending.session.impersonatedBy ?? null,
        },
        request,
        'auth.sign-out',
        {
          entityId: ending.session.id,
          entityLabel: ending.user.email,
          reason: SIGN_OUT_REASONS[trigger] ?? null,
          metadata: SIGN_OUT_REASONS[trigger] ? { trigger } : null,
        }
      );
    }

    const response = new NextResponse(null, { status: StatusCodes.NO_CONTENT });
    appendSetCookies(response, result.data.setCookies);

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
