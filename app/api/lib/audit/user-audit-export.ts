// Writes User Audit as CSV and PDF: the list of Tenant members with their
// sign-in figures, and one member's report (summary, Sessions, failed sign-in
// attempts, IP addresses, devices and activity by Module), each exactly as the
// User Audit Events pages show them. Counts cover the exported date range, which
// every file states.

import { createPdfReport, type PdfReportColumn } from '@/app/api/lib/export/pdf-report';
import {
  USER_AUDIT_DETAIL_LIMIT,
  type UserAuditDetail,
  type UserAuditListItem,
  type UserAuditSessionStatus,
} from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import { sessionDuration } from '@/lib/session-duration';
import { describeUserAgent, parseUserAgent } from '@/lib/user-agent';
import { escapeCsvCell } from './audit-csv';
import {
  auditLocalDateTime,
  auditPeriodLabel,
  auditReportDetails,
  auditReportFooter,
  type AuditReportContext,
} from './audit-export-format';

type Cell = string | number | boolean | null | undefined;
type Range = { fromDate?: string; toDate?: string };

const STATUS_LABELS: Record<UserAuditSessionStatus, string> = {
  active: 'Active',
  'signed-out': 'Signed out',
  revoked: 'Revoked',
  expired: 'Expired',
};

function toCsv(rows: Cell[][]) {
  // A byte-order mark lets Excel open the UTF-8 file with Arabic and accented names intact.
  return `﻿${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}\r\n`;
}

function browserOf(userAgent: string | null) {
  const parsed = parseUserAgent(userAgent);
  return [parsed.browser, parsed.browserVersion].filter(Boolean).join(' ') || null;
}

function rememberMe(value: boolean | null) {
  return value === null ? null : value ? 'Yes' : 'No';
}

function statusOf(isActive: boolean) {
  return isActive ? 'Active' : 'Deactivated';
}

// ---------------------------------------------------------------- the list

const LIST_HEADER = [
  'User',
  'Email',
  'Staff code',
  'Roles',
  'Status',
  'Last sign-in',
  'Last sign-in IP address',
  'Last sign-in browser',
  'Last sign-in operating system',
  'Last activity',
  'Sign-ins',
  'Failed sign-ins',
  'Active Sessions',
  'Actions',
  'Counts cover',
  'Time zone',
  'User ID',
];

export function toUserAuditListCsv(users: UserAuditListItem[], range: Range, timeZone: string) {
  const period = auditPeriodLabel(range.fromDate, range.toDate);

  return toCsv([
    LIST_HEADER,
    ...users.map((user) => [
      user.name,
      user.email,
      user.staffCode,
      user.roles,
      statusOf(user.isActive),
      auditLocalDateTime(user.lastSignInAt, timeZone),
      user.lastSignInIp,
      browserOf(user.lastSignInUserAgent),
      parseUserAgent(user.lastSignInUserAgent).os,
      auditLocalDateTime(user.lastActivityAt, timeZone),
      user.signInCount,
      user.failedSignInCount,
      user.activeSessionCount,
      user.actionCount,
      period,
      timeZone,
      user.userId,
    ]),
  ]);
}

const LIST_COLUMNS: PdfReportColumn[] = [
  { header: 'User' },
  { header: 'Roles', width: 120 },
  { header: 'Status', width: 56 },
  { header: 'Last sign-in', width: 130 },
  { header: 'Last activity', width: 74 },
  { header: 'Sign-ins', width: 46, align: 'right' },
  { header: 'Failed sign-ins', width: 52, align: 'right' },
  { header: 'Active Sessions', width: 52, align: 'right' },
  { header: 'Actions', width: 46, align: 'right' },
];

export function toUserAuditListPdf(
  users: UserAuditListItem[],
  filters: Range & { query?: string },
  context: AuditReportContext
) {
  const { timeZone } = context;

  return createPdfReport({
    title: 'User Audit Events',
    subject: `User Audit for ${context.tenantName}`,
    brand: context.brand,
    details: auditReportDetails(context, {
      period: auditPeriodLabel(filters.fromDate, filters.toDate),
      count: { label: 'Users', value: users.length.toLocaleString('en-US') },
      filters: filters.query ? `Search "${filters.query}"` : 'None',
    }),
    sections: [
      {
        columns: LIST_COLUMNS,
        rows: users.map((user) => [
          [user.name, user.email, user.staffCode].filter(Boolean).join('\n'),
          user.roles ?? '—',
          statusOf(user.isActive),
          user.lastSignInAt
            ? [
                auditLocalDateTime(user.lastSignInAt, timeZone),
                [user.lastSignInIp, describeUserAgent(user.lastSignInUserAgent)]
                  .filter(Boolean)
                  .join(' · '),
              ]
                .filter(Boolean)
                .join('\n')
            : 'Never',
          auditLocalDateTime(user.lastActivityAt, timeZone, 'Never'),
          String(user.signInCount),
          String(user.failedSignInCount),
          String(user.activeSessionCount),
          String(user.actionCount),
        ]),
        emptyText: 'No users match this search.',
      },
    ],
    footerNote: auditReportFooter(context),
  });
}

// ------------------------------------------------------- one member's report

const SESSION_HEADER = [
  'Session ID',
  'Signed in',
  'Ended',
  'Status',
  'How it ended',
  'Duration',
  'Last activity',
  'Actions',
  'IP address',
  'Browser',
  'Operating system',
  'Device type',
  'Remember me',
  'Sign-in recorded',
  'Device',
];

function sessionEnded(session: UserAuditDetail['sessions'][number], timeZone: string) {
  if (session.status === 'active') return 'Still active';
  return auditLocalDateTime(session.endedAt, timeZone, 'Unknown');
}

function howItEnded(session: UserAuditDetail['sessions'][number]) {
  if (session.status === 'active') {
    return session.signInRecorded ? null : 'Sign-in before tracking began';
  }
  return session.endReason;
}

function sessionsNote(detail: UserAuditDetail) {
  return detail.sessionsTruncated
    ? `Latest ${USER_AUDIT_DETAIL_LIMIT} Sessions in this period. The full trail is in All Audit Events.`
    : undefined;
}

function summaryRows(detail: UserAuditDetail): Cell[][] {
  const { summary, timeZone } = detail;

  return [
    ['Sign-ins', summary.signInCount],
    ['Failed sign-ins', summary.failedSignInCount],
    ['Active Sessions', summary.activeSessionCount],
    ['Actions', summary.actionCount],
    ['IP addresses', summary.ipAddressCount],
    ['Devices', summary.deviceCount],
    ['Last sign-in', auditLocalDateTime(summary.lastSignInAt, timeZone, 'Never')],
    ['Last activity', auditLocalDateTime(summary.lastActivityAt, timeZone, 'Never')],
  ];
}

export function toUserAuditDetailCsv(detail: UserAuditDetail, range: Range, now: Date) {
  const { user, timeZone } = detail;
  const note = sessionsNote(detail);

  return toCsv([
    ['User Audit', user.name],
    ['Email', user.email],
    ['Staff code', user.staffCode],
    ['Roles', user.roles],
    ['Status', statusOf(user.isActive)],
    ['Member since', auditLocalDateTime(user.memberSince, timeZone)],
    ['Period', auditPeriodLabel(range.fromDate, range.toDate)],
    ['Time zone', timeZone],
    ['User ID', user.userId],
    [],
    ['Summary'],
    ...summaryRows(detail),
    [],
    ['Sessions'],
    ...(note ? [[note]] : []),
    SESSION_HEADER,
    ...detail.sessions.map((session) => {
      const parsed = parseUserAgent(session.userAgent);
      return [
        session.sessionId,
        auditLocalDateTime(session.signedInAt, timeZone),
        sessionEnded(session, timeZone),
        STATUS_LABELS[session.status],
        howItEnded(session),
        sessionDuration(session, now),
        auditLocalDateTime(session.lastActivityAt, timeZone),
        session.actionCount,
        session.ipAddress,
        browserOf(session.userAgent),
        parsed.os,
        parsed.deviceType,
        rememberMe(session.rememberMe),
        session.signInRecorded,
        session.userAgent,
      ];
    }),
    [],
    ['Failed sign-in attempts'],
    [
      'Date and time',
      'IP address',
      'Browser',
      'Operating system',
      'Device type',
      'Reason',
      'Device',
    ],
    ...detail.failedSignIns.map((attempt) => {
      const parsed = parseUserAgent(attempt.userAgent);
      return [
        auditLocalDateTime(attempt.occurredOn, timeZone),
        attempt.ipAddress,
        browserOf(attempt.userAgent),
        parsed.os,
        parsed.deviceType,
        attempt.reason,
        attempt.userAgent,
      ];
    }),
    [],
    ['IP addresses'],
    ['IP address', 'Events', 'First seen', 'Last seen'],
    ...detail.ipAddresses.map((ip) => [
      ip.ipAddress,
      ip.eventCount,
      auditLocalDateTime(ip.firstSeenAt, timeZone),
      auditLocalDateTime(ip.lastSeenAt, timeZone),
    ]),
    [],
    ['Devices & browsers'],
    ['Browser', 'Operating system', 'Device type', 'Events', 'First seen', 'Last seen', 'Device'],
    ...detail.devices.map((device) => {
      const parsed = parseUserAgent(device.userAgent);
      return [
        browserOf(device.userAgent),
        parsed.os,
        parsed.deviceType,
        device.eventCount,
        auditLocalDateTime(device.firstSeenAt, timeZone),
        auditLocalDateTime(device.lastSeenAt, timeZone),
        device.userAgent,
      ];
    }),
    [],
    ['Activity by Module'],
    ['Module', 'Actions'],
    ...detail.activityByModule.map(({ module, count }) => [module, count]),
  ]);
}

const SESSION_COLUMNS: PdfReportColumn[] = [
  { header: 'Signed in', width: 72 },
  { header: 'Ended', width: 72 },
  { header: 'Status', width: 50 },
  { header: 'How it ended' },
  { header: 'Duration', width: 50 },
  { header: 'Last activity', width: 72 },
  { header: 'Actions', width: 40, align: 'right' },
  { header: 'IP address', width: 70 },
  { header: 'Device', width: 110 },
  { header: 'Remember me', width: 46 },
];

export function toUserAuditDetailPdf(
  detail: UserAuditDetail,
  range: Range,
  context: AuditReportContext,
  now: Date
) {
  const { user, timeZone } = detail;
  const reportContext = { ...context, timeZone };

  return createPdfReport({
    title: `User Audit: ${user.name}`,
    subject: `User Audit for ${user.name} (${user.email})`,
    brand: context.brand,
    details: [
      { label: 'User', value: user.name },
      { label: 'Email', value: user.email },
      { label: 'Status', value: statusOf(user.isActive) },
      { label: 'Staff code', value: user.staffCode ?? '—' },
      { label: 'Member since', value: auditLocalDateTime(user.memberSince, timeZone) },
      ...auditReportDetails(reportContext, {
        period: auditPeriodLabel(range.fromDate, range.toDate),
        count: { label: 'Sessions', value: detail.sessions.length.toLocaleString('en-US') },
      }),
      { label: 'Roles', value: user.roles ?? '—', wide: true },
    ],
    sections: [
      {
        heading: 'Summary',
        columns: summaryRows(detail).map(([label]) => ({ header: String(label) })),
        rows: [summaryRows(detail).map(([, value]) => String(value))],
        emptyText: '',
      },
      {
        heading: 'Sessions',
        note: sessionsNote(detail),
        columns: SESSION_COLUMNS,
        rows: detail.sessions.map((session) => [
          auditLocalDateTime(session.signedInAt, timeZone),
          sessionEnded(session, timeZone),
          STATUS_LABELS[session.status],
          howItEnded(session) ?? '',
          sessionDuration(session, now) ?? '',
          auditLocalDateTime(session.lastActivityAt, timeZone, '—'),
          String(session.actionCount),
          session.ipAddress ?? '—',
          describeUserAgent(session.userAgent) || '—',
          rememberMe(session.rememberMe) ?? '—',
        ]),
        emptyText: 'No Sessions in this period.',
      },
      {
        heading: 'Failed sign-in attempts',
        columns: [
          { header: 'Date and time', width: 100 },
          { header: 'IP address', width: 100 },
          { header: 'Device', width: 200 },
          { header: 'Reason' },
        ],
        rows: detail.failedSignIns.map((attempt) => [
          auditLocalDateTime(attempt.occurredOn, timeZone),
          attempt.ipAddress ?? '—',
          describeUserAgent(attempt.userAgent) || '—',
          attempt.reason ?? '—',
        ]),
        emptyText: 'No failed sign-in attempts in this period.',
      },
      {
        heading: 'IP addresses',
        columns: [
          { header: 'IP address' },
          { header: 'Events', width: 60, align: 'right' },
          { header: 'First seen', width: 110 },
          { header: 'Last seen', width: 110 },
        ],
        rows: detail.ipAddresses.map((ip) => [
          ip.ipAddress,
          String(ip.eventCount),
          auditLocalDateTime(ip.firstSeenAt, timeZone),
          auditLocalDateTime(ip.lastSeenAt, timeZone),
        ]),
        emptyText: 'No IP addresses recorded in this period.',
      },
      {
        heading: 'Devices & browsers',
        columns: [
          { header: 'Device' },
          { header: 'Events', width: 60, align: 'right' },
          { header: 'First seen', width: 110 },
          { header: 'Last seen', width: 110 },
        ],
        rows: detail.devices.map((device) => [
          describeUserAgent(device.userAgent) || device.userAgent,
          String(device.eventCount),
          auditLocalDateTime(device.firstSeenAt, timeZone),
          auditLocalDateTime(device.lastSeenAt, timeZone),
        ]),
        emptyText: 'No devices recorded in this period.',
      },
      {
        heading: 'Activity by Module',
        columns: [{ header: 'Module' }, { header: 'Actions', width: 80, align: 'right' }],
        rows: detail.activityByModule.map(({ module, count }) => [module, String(count)]),
        emptyText: 'No activity in this period.',
      },
    ],
    footerNote: auditReportFooter(reportContext),
  });
}
