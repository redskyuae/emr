import { describe, expect, it } from 'vitest';

import type { AuditEventListItem } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import { escapeCsvCell, toAuditCsv } from './audit-csv';

const event: AuditEventListItem = {
  id: 1,
  tenantId: 'tenant-1',
  occurredOn: new Date('2026-11-22T06:15:00Z'),
  actorUserId: 'user-1',
  actorName: 'Dr. Sara Ali',
  actorEmail: 'sara.ali@hospital.example',
  actorRoles: 'Doctor',
  sessionId: 'sess-1',
  action: 'clinical-note.amend',
  module: 'Visits',
  operation: 'Amend',
  category: 'update',
  outcome: 'success',
  entityType: 'clinical-note',
  entityId: '31',
  entityLabel: null,
  patientId: 7,
  visitId: 12,
  reason: null,
  changes: [
    { field: 'plan', label: 'Plan', from: 'Rest', to: 'Physio, 2 weeks' },
    { field: 'assessment', label: 'Assessment', from: null, to: 'Low back pain' },
  ],
  metadata: null,
  ipAddress: '10.24.44.19',
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36',
  patient: { id: 7, mrn: 'MRN-000007', firstName: 'Ahmed', lastName: 'Khan' },
};

describe('Audit CSV', () => {
  it('should quote cells that hold commas, quotes or line breaks', () => {
    expect(escapeCsvCell('Physio, 2 weeks')).toBe('"Physio, 2 weeks"');
    expect(escapeCsvCell('Said "stop"')).toBe('"Said ""stop"""');
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"');
    expect(escapeCsvCell(null)).toBe('');
  });

  it('should neutralise values a spreadsheet would run as a formula', () => {
    expect(escapeCsvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(escapeCsvCell('+971501234567')).toBe('"\'+971501234567"');
    expect(escapeCsvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
  });

  it('should write one row per changed field with Old and New value columns', () => {
    const csv = toAuditCsv([event], 'Asia/Dubai');
    const [header, ...rows] = csv.replace('\uFEFF', '').trim().split('\r\n');
    const columns = header.split(',');
    const cell = (row: string, name: string) => row.split(',')[columns.indexOf(name)];

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(columns).toEqual(
      expect.arrayContaining([
        'Module',
        'Operation',
        'User roles',
        'Field',
        'Old value',
        'New value',
      ])
    );
    expect(rows).toHaveLength(2);
    expect(cell(rows[1], 'Event ID')).toBe('1');
    expect(cell(rows[1], 'Field')).toBe('Assessment');
    expect(cell(rows[1], 'Old value')).toBe('');
    expect(cell(rows[1], 'New value')).toBe('Low back pain');
    expect(rows[0]).toContain('"Physio, 2 weeks"');
  });

  it('should show the date and time in the Tenant time zone beside UTC', () => {
    const [, row] = toAuditCsv([{ ...event, changes: null }], 'Asia/Dubai')
      .replace('\uFEFF', '')
      .trim()
      .split('\r\n');

    // 06:15 UTC is 10:15 in Dubai (UTC+4).
    expect(row.startsWith('1,sess-1,22-11-2026,10:15:00,Asia/Dubai,2026-11-22T06:15:00.000Z')).toBe(
      true
    );
    expect(row).toContain('Visits,Amend,Amended Clinical Note');
    expect(row).toContain('MRN-000007');
    expect(row).toContain(',Chrome 156,macOS,Desktop,');
  });

  it('should put a support operator in its own column, not in Details', () => {
    const csv = toAuditCsv(
      [{ ...event, changes: null, metadata: { impersonatedBy: 'support-9', rowCount: 3 } }],
      'UTC'
    );
    const row = csv.trim().split('\r\n')[1];

    expect(row.endsWith(',support-9')).toBe(true);
    expect(row).toContain('rowCount: 3');
    expect(row).not.toContain('impersonatedBy');
  });
});
