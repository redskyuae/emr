import { describe, expect, it, vi } from 'vitest';

import { clearRecordedPdfText, recordedPdfText } from '@/test/pdf/recorded-pdf-text';

import type { AuditEventListItem } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import type { AuditReportContext } from './audit-export-format';
import { describeAuditFilters, toAuditPdf } from './audit-pdf';

vi.mock('jspdf', async (importOriginal) =>
  (await import('@/test/pdf/recorded-pdf-text')).withRecordedText(await importOriginal())
);

// Everything the report drew, one string per line or run.
async function drawnText(render: () => Promise<Uint8Array>) {
  clearRecordedPdfText();
  await render();
  return recordedPdfText().join('\n');
}

const event: AuditEventListItem = {
  id: 41,
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
  reason: 'Corrected after review',
  changes: [
    { field: 'plan', label: 'Plan', from: 'Rest', to: 'Physio, 2 weeks' },
    { field: 'assessment', label: 'Assessment', from: null, to: 'Low back pain' },
    { field: 'urgent', label: 'Urgent', from: false, to: true },
  ],
  metadata: { impersonatedBy: 'support@vendor.example' },
  ipAddress: '10.24.44.19',
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0 Safari/537.36',
  patient: { id: 7, mrn: 'MRN-000007', firstName: 'Ahmed', lastName: 'Khan' },
};

const context: AuditReportContext = {
  brand: { organizationName: 'Medical EMR', organizationSubtitle: 'Redsky Consultancy' },
  tenantName: 'Apollo Hospitals',
  timeZone: 'Asia/Dubai',
  exportedAt: new Date('2026-11-22T08:00:00Z'),
  exportedBy: { name: 'Priya Nair', email: 'priya@hospital.example' },
};

describe('Audit PDF', () => {
  it('should describe the filters in words, naming the user and Patient from the events', () => {
    expect(
      describeAuditFilters(
        {
          module: 'Visits',
          operation: 'Amend',
          actorUserId: 'user-1',
          patientId: 7,
          visitId: 12,
          query: 'plan',
        },
        [event]
      )
    ).toBe(
      'Module Visits · Operation Amend · User Dr. Sara Ali · Patient MRN-000007 Ahmed Khan · Visit #12 · Search "plan"'
    );
  });

  it('should fall back to ids when no event names them, and say None without filters', () => {
    expect(describeAuditFilters({ actorUserId: 'user-9', patientId: 3 }, [])).toBe(
      'User user-9 · Patient #3'
    );
    expect(describeAuditFilters({}, [event])).toBe('None');
  });

  it('should lay out each event with its changes, Patient, reason and source', async () => {
    const text = await drawnText(() => toAuditPdf([event], { fromDate: '2026-11-01' }, context));

    expect(text).toContain('All Audit Events');
    expect(text).toContain('From 01-11-2026');
    expect(text).toContain('Amended Clinical Note');
    expect(text).toContain('MRN-000007');
    expect(text).toContain('Plan: Rest -> Physio, 2 weeks');
    expect(text).toContain('Assessment: (empty) -> Low back pain');
    expect(text).toContain('Urgent: No -> Yes');
    expect(text).toContain('Reason: Corrected');
    expect(text).toContain('Support:');
    expect(text).toContain('support@vendor.example');
    expect(text).toContain('Chrome 156 on');
    expect(text).toContain('Exported 22-11-2026 12:00:00 by Priya Nair');
  });

  it('should print an Arabic Patient name as written', async () => {
    const arabicPatient = {
      ...event,
      patient: { id: 7, mrn: 'MRN-000007', firstName: 'فاطمة', lastName: 'الزهراء' },
    };

    const text = await drawnText(() => toAuditPdf([arabicPatient], {}, context));

    expect(text).toContain('MRN-000007');
    expect(text).toContain('فاطمة الزهراء');
    expect(text).not.toContain('?????');
  });

  it('should say so when nothing matches', async () => {
    const text = await drawnText(() => toAuditPdf([], {}, context));

    expect(text).toContain('No Audit Events match these filters.');
  });
});
