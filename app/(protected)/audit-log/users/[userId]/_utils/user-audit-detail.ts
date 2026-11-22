import type { UserAuditSessionStatus } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import { parseUserAgent } from '@/lib/user-agent';

const STATUS_PRESENTATION: Record<
  UserAuditSessionStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  active: { label: 'Active', variant: 'default' },
  'signed-out': { label: 'Signed out', variant: 'secondary' },
  revoked: { label: 'Revoked', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'outline' },
};

export function sessionStatusPresentation(status: UserAuditSessionStatus) {
  return STATUS_PRESENTATION[status];
}

export function rememberMeLabel(value: boolean | null) {
  if (value === null) return '—';
  return value ? 'Yes' : 'No';
}

/** Browser with major version, operating system and device type, each `—` when unknown. */
export function deviceColumns(userAgent: string | null) {
  const parsed = parseUserAgent(userAgent);

  return {
    browser: [parsed.browser, parsed.browserVersion].filter(Boolean).join(' ') || '—',
    os: parsed.os ?? '—',
    deviceType: parsed.deviceType ?? '—',
  };
}

/** A bar width in percent, relative to the busiest Module; at least 2% so a count stays visible. */
export function moduleBarWidth(count: number, maxCount: number) {
  if (maxCount <= 0 || count <= 0) return 0;
  return Math.max(2, Math.round((count / maxCount) * 100));
}

/** The Audit Log filtered to this user, optionally to one Module or Session. */
export function auditLogHref(filters: { actor?: string; module?: string; session?: string }) {
  const params = new URLSearchParams();

  if (filters.actor) params.set('actor', filters.actor);
  if (filters.module) params.set('module', filters.module);
  if (filters.session) params.set('session', filters.session);

  return `/audit-log?${params.toString()}`;
}
