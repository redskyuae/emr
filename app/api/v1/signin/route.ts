import { StatusCodes } from 'http-status-codes';
import { after, type NextRequest, NextResponse } from 'next/server';
import type { SigninResponse } from './types';

import { identifyTenantGroup } from '@/app/api/lib/analytics/access-tenant-event';
import {
  analyticsSessionIdFromRequest,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
import { signinCommand } from '@/app/api/lib/modules/auth/commands/signin-command';
import { getSignInAuditActorQuery } from '@/app/api/lib/modules/auth/queries/get-sign-in-audit-actor-query';
import { hasReachedFailedSignInAuditCapQuery } from '@/app/api/lib/modules/audit-log/queries/has-reached-failed-sign-in-audit-cap-query';

function mutationMessage(status: number, errors: string[]) {
  if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
    return 'Internal Server Error';
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

// A rejected password or a blocked account is recorded in the targeted user's
// Tenants, so repeated attempts show on their User Audit. The password is never
// recorded, and an email that matches no one is not recorded at all. Past the cap
// of recent failed sign-ins in a Tenant, further attempts are not recorded there,
// so a loop of wrong passwords cannot grow the append-only table without bound.
async function recordFailedSignIn(request: NextRequest, payload: unknown, reason: string) {
  try {
    const email = (payload as { email?: unknown } | null)?.email;
    const actor = await getSignInAuditActorQuery(email);

    if (!actor) return;

    for (const tenantId of actor.tenantIds) {
      const cap = await hasReachedFailedSignInAuditCapQuery(tenantId, actor.user.id);

      if (cap.success && cap.data) continue;

      await recordAuditEventFor(
        { tenantId, userId: actor.user.id, name: actor.user.name, email: actor.user.email },
        request,
        'auth.sign-in-failed',
        { reason, outcome: 'failed', entityLabel: actor.user.email }
      );
    }
  } catch (error) {
    console.error('Failed sign-in was not recorded', error);
  }
}

function appendSetCookies(response: NextResponse, setCookies: string[]) {
  for (const setCookie of setCookies) {
    response.headers.append('Set-Cookie', setCookie);
  }
}

export async function POST(request: NextRequest) {
  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await signinCommand(payload, request.headers);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message = mutationMessage(status, result.errors);

      if (status === StatusCodes.UNAUTHORIZED || status === StatusCodes.FORBIDDEN) {
        // Recorded after the response: the extra reads happen only for an email that
        // names someone, so waiting on them would tell a caller which emails exist.
        const reason = result.errors[0] ?? message;

        after(() => recordFailedSignIn(request, payload, reason));
      }

      if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
        return NextResponse.json({ message }, { status });
      }

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    const response = NextResponse.json<SigninResponse>({ data: { tenant: result.data.tenant } });

    appendSetCookies(response, result.data.setCookies);

    const { tenant, userId, rememberMe, userName, userEmail, sessionId } = result.data;

    await recordAuditEventFor(
      { tenantId: tenant.id, userId, name: userName, email: userEmail, sessionId },
      request,
      'auth.sign-in',
      { entityId: sessionId, entityLabel: userEmail, metadata: { rememberMe } }
    );

    recordServerEvent(
      { userId, tenantId: tenant.id, sessionId: analyticsSessionIdFromRequest(request) },
      'user_signed_in',
      { remember_me: rememberMe }
    );
    identifyTenantGroup(tenant);

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
