import { describe, expect, it, vi } from 'vitest';

import { clearRecordedPdfText, recordedPdfText } from '@/test/pdf/recorded-pdf-text';

import type {
  UserAuditDetail,
  UserAuditListItem,
} from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import type { AuditReportContext } from './audit-export-format';
import {
  toUserAuditDetailCsv,
  toUserAuditDetailPdf,
  toUserAuditListCsv,
  toUserAuditListPdf,
} from './user-audit-export';

vi.mock('jspdf', async (importOriginal) =>
  (await import('@/test/pdf/recorded-pdf-text')).withRecordedText(await importOriginal())
);

// Everything the report drew, one string per line or run.
async function drawnText(render: () => Promise<Uint8Array>) {
  clearRecordedPdfText();
  await render();
  return recordedPdfText().join('\n');
}
const chrome =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36';

const user: UserAuditListItem = {
  userId: 'user-1',
  name: 'Dr. Sara Ali',
  email: 'sara.ali@hospital.example',
  roles: 'Doctor, Tenant Admin',
  isActive: true,
  staffCode: 'DR-01',
  lastSignInAt: new Date('2026-11-22T05:00:00Z'),
  lastSignInIp: '10.0.0.7',
  lastSignInUserAgent: chrome,
  lastActivityAt: null,
  signInCount: 4,
  failedSignInCount: 1,
  actionCount: 37,
  activeSessionCount: 1,
};

const now = new Date('2026-11-22T08:00:00Z');

const detail: UserAuditDetail = {
  timeZone: 'Asia/Dubai',
  user: {
    userId: 'user-1',
    name: 'Dr. Sara Ali',
    email: 'sara.ali@hospital.example',
    roles: 'Doctor',
    isActive: false,
    staffCode: null,
    memberSince: new Date('2026-01-05T06:00:00Z'),
    accountCreatedAt: new Date('2026-01-05T06:00:00Z'),
  },
  summary: {
    signInCount: 2,
    failedSignInCount: 1,
    actionCount: 9,
    activeSessionCount: 1,
    ipAddressCount: 1,
    deviceCount: 1,
    lastSignInAt: new Date('2026-11-22T05:00:00Z'),
    lastActivityAt: null,
  },
  sessions: [
    {
      sessionId: 'session-2',
      signedInAt: new Date('2026-11-22T06:00:00Z'),
      endedAt: null,
      status: 'active',
      endReason: null,
      expiresAt: null,
      lastActivityAt: new Date('2026-11-22T07:00:00Z'),
      actionCount: 5,
      ipAddress: '10.0.0.7',
      userAgent: chrome,
      rememberMe: null,
      signInRecorded: false,
    },
    {
      sessionId: 'session-1',
      signedInAt: new Date('2026-11-21T06:00:00Z'),
      endedAt: new Date('2026-11-21T08:14:00Z'),
      status: 'signed-out',
      endReason: 'Signed out by the user',
      expiresAt: null,
      lastActivityAt: null,
      actionCount: 4,
      ipAddress: '10.0.0.7',
      userAgent: chrome,
      rememberMe: true,
      signInRecorded: true,
    },
  ],
  sessionsTruncated: true,
  failedSignIns: [
    {
      occurredOn: new Date('2026-11-20T06:00:00Z'),
      ipAddress: '10.0.0.9',
      userAgent: chrome,
      reason: 'Invalid email or password',
    },
  ],
  ipAddresses: [
    {
      ipAddress: '10.0.0.7',
      eventCount: 9,
      firstSeenAt: new Date('2026-11-21T06:00:00Z'),
      lastSeenAt: new Date('2026-11-22T07:00:00Z'),
    },
  ],
  devices: [
    {
      userAgent: chrome,
      eventCount: 9,
      firstSeenAt: new Date('2026-11-21T06:00:00Z'),
      lastSeenAt: new Date('2026-11-22T07:00:00Z'),
    },
  ],
  activityByModule: [{ module: 'Visits', count: 9 }],
};

const context: AuditReportContext = {
  brand: { organizationName: 'Medical EMR', organizationSubtitle: 'Redsky Consultancy' },
  tenantName: 'Apollo Hospitals',
  timeZone: 'Asia/Dubai',
  exportedAt: now,
  exportedBy: { name: 'Priya Nair', email: 'priya@hospital.example' },
};

function linesOf(csv: string) {
  return csv.replace('﻿', '').trimEnd().split('\r\n');
}

describe('User Audit export', () => {
  it('should write the list with one row per member and the period it covers', () => {
    const csv = toUserAuditListCsv(
      [user],
      { fromDate: '2026-11-01', toDate: '2026-11-22' },
      'Asia/Dubai'
    );
    const [header, row] = linesOf(csv);

    expect(csv.startsWith('﻿')).toBe(true);
    expect(header.split(',')).toContain('Failed sign-ins');
    expect(row).toBe(
      'Dr. Sara Ali,sara.ali@hospital.example,DR-01,"Doctor, Tenant Admin",Active,22-11-2026 09:00:00,10.0.0.7,Chrome 156,macOS,,4,1,1,37,01-11-2026 to 22-11-2026,Asia/Dubai,user-1'
    );
  });

  it('should write one member’s report in labelled sections', () => {
    const lines = linesOf(toUserAuditDetailCsv(detail, {}, now));

    expect(lines.slice(0, 3)).toEqual([
      'User Audit,Dr. Sara Ali',
      'Email,sara.ali@hospital.example',
      'Staff code,',
    ]);
    expect(lines).toContain('Status,Deactivated');
    expect(lines).toContain('Period,All dates');
    for (const section of [
      'Summary',
      'Sessions',
      'Failed sign-in attempts',
      'IP addresses',
      'Devices & browsers',
      'Activity by Module',
    ]) {
      expect(lines).toContain(section);
    }
    expect(lines).toContain(
      'Latest 100 Sessions in this period. The full trail is in All Audit Events.'
    );
    expect(lines).toContain('Visits,9');
  });

  it('should describe each Session from sign-in to how it ended', () => {
    const lines = linesOf(toUserAuditDetailCsv(detail, {}, now));
    const active = lines.find((line) => line.startsWith('session-2,'));
    const ended = lines.find((line) => line.startsWith('session-1,'));

    expect(active).toContain('Still active,Active,Sign-in before tracking began,2 h');
    expect(active).toContain(',No,');
    expect(ended).toContain('Signed out,Signed out by the user,2 h 14 min');
    expect(ended).toContain(',Yes,Yes,');
  });

  it('should write the list and one member’s report as PDF', async () => {
    const list = await drawnText(() => toUserAuditListPdf([user], { query: 'sara' }, context));
    const report = await drawnText(() => toUserAuditDetailPdf(detail, {}, context, now));

    expect(list).toContain('User Audit Events');
    expect(list).toContain('Search "sara"');
    expect(list).toContain('Dr. Sara Ali');
    expect(report).toContain('User Audit: Dr. Sara Ali');
    expect(report).toContain('Signed out by the user');
    expect(report).toContain('Invalid email or password');
    expect(report).toContain('Latest 100 Sessions in this period.');
  });
});
