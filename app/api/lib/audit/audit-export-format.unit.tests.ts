import { describe, expect, it } from 'vitest';

import {
  auditDisplayDate,
  auditFileDate,
  auditLocalDateTime,
  auditPeriodLabel,
  auditReportDetails,
  auditReportFooter,
  auditTruncate,
  describeAuditMetadata,
  type AuditReportContext,
} from './audit-export-format';

const context: AuditReportContext = {
  brand: { organizationName: 'Medical EMR', organizationSubtitle: 'Redsky Consultancy' },
  tenantName: 'Apollo Hospitals',
  timeZone: 'Asia/Dubai',
  exportedAt: new Date('2026-11-22T20:30:00Z'),
  exportedBy: { name: 'Dr. Sara Ali', email: 'sara.ali@hospital.example' },
};

describe('Audit export formatting', () => {
  it('should show times in the Tenant time zone', () => {
    expect(auditLocalDateTime(new Date('2026-11-22T20:30:00Z'), 'Asia/Dubai')).toBe(
      '23-11-2026 00:30:00'
    );
    expect(auditLocalDateTime(null, 'Asia/Dubai', 'Never')).toBe('Never');
  });

  it('should name files by the Tenant’s date, not the server’s', () => {
    expect(auditFileDate(new Date('2026-11-22T20:30:00Z'), 'Asia/Dubai')).toBe('2026-11-23');
  });

  it('should describe the period in words', () => {
    expect(auditDisplayDate('2026-11-01')).toBe('01-11-2026');
    expect(auditPeriodLabel('2026-11-01', '2026-11-22')).toBe('01-11-2026 to 22-11-2026');
    expect(auditPeriodLabel('2026-11-01', undefined)).toBe('From 01-11-2026');
    expect(auditPeriodLabel(undefined, '2026-11-22')).toBe('Up to 22-11-2026');
    expect(auditPeriodLabel(undefined, undefined)).toBe('All dates');
  });

  it('should spell out object items in metadata lists rather than print [object Object]', () => {
    expect(
      describeAuditMetadata({
        added: [],
        changed: [{ code: 'M54.5', from: { type: 'Secondary' }, to: { type: 'Principal' } }],
      })
    ).toBe(
      'added: —; changed: {"code":"M54.5","from":{"type":"Secondary"},"to":{"type":"Principal"}}'
    );
  });

  it('should cut long values with an ellipsis', () => {
    expect(auditTruncate('abcdefghij', 8)).toBe('abcde...');
    expect(auditTruncate('short', 8)).toBe('short');
  });

  it('should open every report with the Tenant, period, count and who exported it', () => {
    expect(
      auditReportDetails(context, {
        period: 'All dates',
        count: { label: 'Users', value: '4' },
        filters: 'None',
      })
    ).toEqual([
      { label: 'Tenant', value: 'Apollo Hospitals' },
      { label: 'Period', value: 'All dates' },
      { label: 'Users', value: '4' },
      { label: 'Exported at', value: '23-11-2026 00:30:00 (Asia/Dubai)' },
      { label: 'Exported by', value: 'Dr. Sara Ali (sara.ali@hospital.example)' },
      { label: 'Filters', value: 'None', wide: true },
    ]);
    expect(auditReportFooter(context)).toBe(
      'Confidential · Apollo Hospitals · Exported 23-11-2026 00:30:00 by Dr. Sara Ali'
    );
  });
});
