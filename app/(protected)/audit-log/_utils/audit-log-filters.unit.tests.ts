import { describe, expect, it } from 'vitest';

import type { AuditEventListItem } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import {
  actionLabel,
  countActiveFilters,
  describeDevice,
  eventDetails,
  formatAuditTime,
  formatChangeValue,
  recordTypeLabel,
  resolveFilters,
  splitAuditTime,
  toAuditEventsParams,
} from './audit-log-filters';

const emptyUrl = {
  q: null,
  to: null,
  from: null,
  visit: null,
  module: null,
  patient: null,
  operation: null,
};

function event(overrides: Partial<AuditEventListItem>): AuditEventListItem {
  return {
    id: 1,
    tenantId: 'tenant-1',
    occurredOn: new Date('2026-11-22T06:15:00Z'),
    actorUserId: 'user-1',
    actorName: 'Dr. Sara Ali',
    actorEmail: null,
    actorRoles: null,
    sessionId: null,
    action: 'visit.view',
    module: 'Visits',
    operation: 'View',
    category: 'access',
    outcome: 'success',
    entityType: 'visit',
    entityId: '12',
    entityLabel: null,
    patientId: null,
    visitId: 12,
    reason: null,
    changes: null,
    metadata: null,
    ipAddress: null,
    userAgent: null,
    patient: null,
    ...overrides,
  };
}

describe('Audit Log filters', () => {
  it('should drop malformed URL values', () => {
    expect(
      resolveFilters({
        ...emptyUrl,
        from: '22-11-2026',
        module: 'Pharmacy',
        operation: 'Teleport',
        patient: '0',
        visit: 'abc',
      })
    ).toEqual({
      query: '',
      to: null,
      from: null,
      visitId: null,
      patientId: null,
      module: null,
      operation: null,
      actorUserId: null,
      sessionId: null,
    });
  });

  it('should accept a user and Session scope from User Audit links', () => {
    const filters = resolveFilters({ ...emptyUrl, actor: 'liEjlOC0cra1U8rb', session: 'x y' });

    expect(filters).toMatchObject({ actorUserId: 'liEjlOC0cra1U8rb', sessionId: null });
    expect(toAuditEventsParams(filters)).toMatchObject({ actorUserId: 'liEjlOC0cra1U8rb' });
  });

  it('should drop both dates when the range is inverted', () => {
    const filters = resolveFilters({ ...emptyUrl, from: '2026-11-20', to: '2026-11-01' });

    expect(filters).toMatchObject({ from: null, to: null });
  });

  it('should count each active filter once and map them to API params', () => {
    const filters = resolveFilters({
      ...emptyUrl,
      q: ' priya ',
      from: '2026-11-01',
      to: '2026-11-22',
      patient: '7',
      module: 'Visits',
      operation: 'Amend',
    });

    expect(countActiveFilters(filters)).toBe(5);
    expect(toAuditEventsParams(filters)).toEqual({
      fromDate: '2026-11-01',
      toDate: '2026-11-22',
      query: 'priya',
      module: 'Visits',
      operation: 'Amend',
      patientId: 7,
      actorUserId: undefined,
      sessionId: undefined,
      visitId: undefined,
    });
  });

  it('should label known actions and fall back to the code for unknown ones', () => {
    expect(actionLabel('clinical-note.amend')).toBe('Amended Clinical Note');
    expect(actionLabel('lab.order')).toBe('lab.order');
    expect(recordTypeLabel('clinical-note')).toBe('Clinical Note');
  });

  it('should format times in the Tenant time zone', () => {
    expect(formatAuditTime('2026-11-22T20:30:00Z', 'Asia/Dubai')).toContain('23 Nov 2026');
    expect(splitAuditTime('2026-11-22T20:30:00Z', 'Asia/Dubai')).toEqual({
      date: '23 Nov 2026',
      time: '00:30:00',
    });
  });

  it('should show empty and boolean change values in words', () => {
    expect(formatChangeValue(null)).toBe('—');
    expect(formatChangeValue(true)).toBe('Yes');
    expect(formatChangeValue(120)).toBe('120');
  });

  it('should describe the reason, diagnosis codes and exports, never the field changes', () => {
    expect(eventDetails(event({ reason: 'Patient left' }))).toBe('Patient left');
    expect(eventDetails(event({ metadata: { added: ['R51'], removed: ['M54.5'] } }))).toBe(
      'Added R51; Removed M54.5'
    );
    expect(eventDetails(event({ metadata: { rowCount: 40 } }))).toBe('40 events exported');
    expect(eventDetails(event({ metadata: { method: 'cash', impersonatedBy: 'x' } }))).toBe(
      'method: cash'
    );
    expect(
      eventDetails(event({ changes: [{ field: 'a', label: 'Plan', from: null, to: 'x' }] }))
    ).toBeNull();
  });

  it('should name the browser and operating system of a device', () => {
    expect(
      describeDevice(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36'
      )
    ).toBe('Chrome 156 on macOS');
    expect(
      describeDevice(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1'
      )
    ).toBe('Safari 18 on iOS');
    expect(describeDevice(null)).toBeNull();
  });
});
