import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRecordedPdfText, recordedPdfText } from '@/test/pdf/recorded-pdf-text';
import { createPdfReport, type PdfReport } from './pdf-report';

vi.mock('jspdf', async (importOriginal) =>
  (await import('@/test/pdf/recorded-pdf-text')).withRecordedText(await importOriginal())
);

const latin1 = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1');

const report: PdfReport = {
  title: 'All Audit Events',
  subject: 'Audit Events for Apollo Hospitals',
  brand: { organizationName: 'Medical EMR', organizationSubtitle: 'Redsky Consultancy' },
  details: [
    { label: 'Tenant', value: 'مستشفى أبولو' },
    { label: 'Filters', value: 'Module Visits', wide: true },
  ],
  sections: [
    {
      heading: 'Sessions',
      columns: [
        { header: 'Signed in' },
        { header: 'Patient' },
        { header: 'Actions', align: 'right' },
      ],
      rows: [['22-11-2026 14:05:09', 'MRN-000007 فاطمة Khan', '12']],
      emptyText: 'No Sessions.',
    },
    {
      heading: 'Failed sign-in attempts',
      columns: [{ header: 'Date and time' }],
      rows: [],
      emptyText: 'No failed sign-in attempts in this period.',
    },
  ],
  footerNote: 'Confidential · Apollo Hospitals',
};

describe('PDF report', () => {
  beforeEach(() => {
    clearRecordedPdfText();
  });

  it('should write a PDF that embeds Noto Sans and Noto Sans Arabic', async () => {
    const text = latin1(await createPdfReport(report));

    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text).toContain('NotoSans');
    expect(text).toContain('NotoSansArabic');
  });

  it('should draw the title, details, tables, empty sections and page numbers', async () => {
    await createPdfReport(report);
    const drawn = recordedPdfText();

    expect(drawn).toEqual(
      expect.arrayContaining([
        'All Audit Events',
        'TENANT',
        'Module Visits',
        '22-11-2026 14:05:09',
        'No failed sign-in attempts in this period.',
        'Confidential · Apollo Hospitals',
        'Page 1 of 1',
      ])
    );
  });

  it('should draw Arabic in its own run, in the details and inside a table cell', async () => {
    await createPdfReport(report);
    const drawn = recordedPdfText();

    expect(drawn).toContain('مستشفى أبولو');
    expect(drawn).toEqual(expect.arrayContaining(['MRN-000007 ', 'فاطمة', ' Khan']));
  });

  it('should flow a long table onto further pages', async () => {
    const rows = Array.from({ length: 200 }, (_, index) => [`Row ${index}`, '', String(index)]);
    await createPdfReport({ ...report, sections: [{ ...report.sections[0], rows }] });
    const drawn = recordedPdfText();

    expect(drawn.some((line) => /^Page 1 of [2-9]$/.test(line))).toBe(true);
    expect(drawn).toContain('Row 199');
  });
});
