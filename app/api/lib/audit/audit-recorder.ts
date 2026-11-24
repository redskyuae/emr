// Records an Audit Event from a route's success branch (ADR 0053). The actor comes
// from the Session and the request context from headers, never from a request
// body. Recording is awaited, so the event is written before the response leaves,
// but a failure to record is logged and swallowed: the action has already
// happened, and failing the response would invite a duplicate retry.
//
// Details that need a read of their own after the write (a label, the Patient)
// are passed as a function, which runs inside the same try/catch: a failed
// lookup costs the Audit Event, never the response.

import { recordAuditEventCommand } from '@/app/api/lib/modules/audit-log/commands/record-audit-event-command';
import type { AuditAction } from '@/app/api/lib/modules/audit-log/schemas/audit-action-catalogue';
import type {
  AUDIT_OUTCOMES,
  AuditChange,
} from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';

type AuditEventDetails = {
  entityId?: string | number | null;
  entityLabel?: string | null;
  patientId?: number | null;
  visitId?: number | null;
  reason?: string | null;
  changes?: AuditChange[] | null;
  metadata?: Record<string, unknown> | null;
  outcome?: (typeof AUDIT_OUTCOMES)[number];
};

type AuditEventDetailsSource =
  AuditEventDetails | (() => AuditEventDetails | Promise<AuditEventDetails>);

/** Who acted, for an event recorded where there is no Session yet (a sign-in). */
type AuditActor = {
  tenantId: string;
  userId: string;
  name: string | null | undefined;
  email: string;
  sessionId?: string | null;
  impersonatedBy?: string | null;
};

function clientIpAddress(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  return forwardedFor || request.headers.get('x-real-ip')?.trim() || null;
}

export async function recordAuditEventFor(
  actor: AuditActor,
  request: Request,
  action: AuditAction,
  detailsSource: AuditEventDetailsSource = {}
): Promise<void> {
  try {
    const details = typeof detailsSource === 'function' ? await detailsSource() : detailsSource;
    // Support access must be visible to the Tenant: an impersonated Session is
    // recorded as the impersonated user, with the real operator alongside.
    const metadata = actor.impersonatedBy
      ? { ...details.metadata, impersonatedBy: actor.impersonatedBy }
      : details.metadata;

    const result = await recordAuditEventCommand({
      ...details,
      action,
      metadata,
      tenantId: actor.tenantId,
      sessionId: actor.sessionId ?? null,
      actorName: actor.name?.trim() || actor.email,
      ipAddress: clientIpAddress(request),
      userAgent: request.headers.get('user-agent'),
      actorEmail: actor.email,
      actorUserId: actor.userId,
    });

    if (!result.success) {
      console.error('Audit Event was not recorded', action, result.errors);
    }
  } catch (error) {
    console.error('Audit Event was not recorded', action, error);
  }
}

export async function recordAuditEvent(
  tenantSession: TenantSession,
  request: Request,
  action: AuditAction,
  details: AuditEventDetailsSource = {}
): Promise<void> {
  // Read defensively: a malformed Session must not turn a successful action into an error.
  const { user, session } = (tenantSession.session ?? {}) as Partial<TenantSession['session']>;

  if (!user) {
    console.error('Audit Event was not recorded', action, ['No Session user']);
    return;
  }

  const sessionRecord = session as { id?: string; impersonatedBy?: string | null } | undefined;

  await recordAuditEventFor(
    {
      tenantId: tenantSession.tenantId,
      userId: user.id,
      name: user.name,
      email: user.email,
      sessionId: sessionRecord?.id ?? null,
      impersonatedBy: sessionRecord?.impersonatedBy ?? null,
    },
    request,
    action,
    details
  );
}
