import { describe, expect, it } from 'vitest';

import {
  auditLogHref,
  deviceColumns,
  moduleBarWidth,
  rememberMeLabel,
  sessionStatusPresentation,
} from './user-audit-detail';
import { userAuditRangeFormSchema } from './user-audit-range-form-schema';

describe('User Audit detail helpers', () => {
  it('should present each Session status', () => {
    expect(sessionStatusPresentation('active').label).toBe('Active');
    expect(sessionStatusPresentation('revoked').variant).toBe('destructive');
  });

  it('should split a user agent into browser, operating system and device type', () => {
    expect(
      deviceColumns(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.8078.100 Safari/537.36'
      )
    ).toEqual({ browser: 'Chrome 156', os: 'macOS', deviceType: 'Desktop' });
    expect(deviceColumns(null)).toEqual({ browser: '—', os: '—', deviceType: '—' });
  });

  it('should size Module bars against the busiest Module', () => {
    expect(moduleBarWidth(50, 100)).toBe(50);
    expect(moduleBarWidth(1, 1000)).toBe(2);
    expect(moduleBarWidth(0, 10)).toBe(0);
  });

  it('should label Remember me and build Audit Log links', () => {
    expect(rememberMeLabel(true)).toBe('Yes');
    expect(rememberMeLabel(null)).toBe('—');
    expect(auditLogHref({ actor: 'u1', module: 'Identity & Access' })).toBe(
      '/audit-log?actor=u1&module=Identity+%26+Access'
    );
  });

  it('should require an ordered date range', () => {
    expect(
      userAuditRangeFormSchema.safeParse({ from: '2026-11-20', to: '2026-11-01' }).error?.issues[0]
        .message
    ).toBe('From date must be on or before To date');
    expect(
      userAuditRangeFormSchema.safeParse({ from: '2026-11-01', to: '2026-11-20' }).success
    ).toBe(true);
  });
});
