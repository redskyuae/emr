import { describe, expect, it } from 'vitest';

import {
  defaultUserAuditRange,
  isDefaultUserAuditRange,
  resolveUserAuditRange,
  tenantTodayIso,
  userAuditRangeLabel,
} from './user-audit-range';

describe('User Audit range', () => {
  it('should default to the last 30 days including today', () => {
    expect(defaultUserAuditRange('2026-11-22')).toEqual({ from: '2026-10-24', to: '2026-11-22' });
  });

  it('should take today from the Tenant time zone', () => {
    expect(tenantTodayIso(new Date('2026-11-22T21:00:00Z'), 'Asia/Dubai')).toBe('2026-11-23');
  });

  it('should keep a valid URL range and fall back for a malformed or inverted one', () => {
    expect(resolveUserAuditRange({ from: '2026-11-01', to: '2026-11-05' }, '2026-11-22')).toEqual({
      from: '2026-11-01',
      to: '2026-11-05',
    });
    expect(resolveUserAuditRange({ from: '01-11-2026', to: null }, '2026-11-22')).toEqual(
      defaultUserAuditRange('2026-11-22')
    );
    expect(resolveUserAuditRange({ from: '2026-11-20', to: '2026-11-01' }, '2026-11-22')).toEqual(
      defaultUserAuditRange('2026-11-22')
    );
  });

  it('should fall back for a date that is not on the calendar', () => {
    const fallback = defaultUserAuditRange('2026-11-22');

    expect(resolveUserAuditRange({ from: '2026-02-30', to: null }, '2026-11-22')).toEqual(fallback);
    expect(resolveUserAuditRange({ from: '0000-01-01', to: null }, '2026-11-22')).toEqual(fallback);
    expect(resolveUserAuditRange({ from: '2024-02-29', to: '2024-03-01' }, '2026-11-22')).toEqual({
      from: '2024-02-29',
      to: '2024-03-01',
    });
  });

  it('should tell the default range apart and label ranges briefly', () => {
    expect(isDefaultUserAuditRange(defaultUserAuditRange('2026-11-22'), '2026-11-22')).toBe(true);
    expect(userAuditRangeLabel({ from: '2026-10-24', to: '2026-11-22' })).toBe(
      '24 Oct – 22 Nov 2026'
    );
    expect(userAuditRangeLabel({ from: '2026-11-22', to: '2026-11-22' })).toBe('22 Nov 2026');
  });
});
